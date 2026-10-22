
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import PageHeader from "../components/PageHeader.jsx";
import Field from "../components/Field.jsx";
import { useCart } from "../context/CartContext.jsx";
import { api } from "../services/api.js";
import { money } from "../utils.js";
import "./Checkout.css";

const RAZORPAY_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    let script = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`
    );

    if (script?.dataset.loaded === "true") {
      if (window.Razorpay) {
        resolve(true);
      } else {
        reject(new Error("Razorpay could not be initialized. Please try again."));
      }
      return;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
    }

    const handleLoad = () => {
      script.dataset.loaded = "true";

      if (window.Razorpay) {
        resolve(true);
      } else {
        reject(
          new Error("Razorpay could not be initialized. Please try again.")
        );
      }
    };

    const handleError = () => {
      script.remove();
      reject(
        new Error(
          "Unable to load Razorpay. Check your internet connection and try again."
        )
      );
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!script.isConnected) {
      document.body.appendChild(script);
    }
  });
}

function openRazorpay(options) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let razorpay;

    const succeed = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    try {
      razorpay = new window.Razorpay({
        ...options,

        handler: async (response) => {
          try {
            const verification = await api.verifyPayment(response);
            succeed(verification);
          } catch (error) {
            fail(
              new Error(
                error.message ||
                  "Payment verification failed. Please check My Orders before trying again."
              )
            );
          }
        },

        modal: {
          ondismiss: () => {
            fail(
              new Error(
                "Payment window closed. If you completed a payment, check My Orders before trying again."
              )
            );
          },
        },
      });

      razorpay.on("payment.failed", (response) => {
        fail(
          new Error(
            response?.error?.description ||
              "Payment failed. Please try again or choose Cash on delivery."
          )
        );
      });

      razorpay.open();
    } catch (error) {
      fail(error);
    }
  });
}

function couponDescription(coupon) {
  return coupon.type === "flat"
    ? `${money(Number(coupon.value) || 0)} off`
    : `${Number(coupon.value) || 0}% off`;
}

export default function Checkout() {
  const { lines, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [addr, setAddr] = useState({
    name: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const [method, setMethod] = useState("upi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponsLoadError, setCouponsLoadError] = useState("");

  const total = Math.max(0, subtotal - (coupon?.discount || 0));

  useEffect(() => {
    let cancelled = false;

    async function loadCoupons() {
      setCouponsLoading(true);
      setCouponsLoadError("");

      try {
        const result = await api.getAvailableCoupons();

        if (!cancelled) {
          setAvailableCoupons(
            Array.isArray(result.items) ? result.items : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setAvailableCoupons([]);
          setCouponsLoadError(
            err.message || "Unable to load available coupons."
          );
        }
      } finally {
        if (!cancelled) {
          setCouponsLoading(false);
        }
      }
    }

    loadCoupons();

    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key) => (event) => {
    setAddr((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));
    setError("");
  };

  async function applyCoupon(codeToApply = couponInput) {
    const code = String(codeToApply || "").trim();

    if (couponBusy || !code) return;

    setCouponBusy(true);
    setCouponError("");

    try {
      const result = await api.validateCoupon({
        code,
        subtotal,
      });

      setCoupon({
        code: result.code,
        discount: Math.min(subtotal, Number(result.discount) || 0),
      });

      setCouponInput(result.code);
    } catch (err) {
      setCoupon(null);
      setCouponError(err.message || "Unable to apply this promo code.");
    } finally {
      setCouponBusy(false);
    }
  }

  function getOrderPayload() {
    return {
      items: lines.map((line) => ({
        productId: line.id,
        size: line.size,
        qty: line.qty,
      })),

      ...(coupon ? { couponCode: coupon.code } : {}),

      address: {
        fullName: addr.name.trim(),
        phone: addr.phone.trim(),
        line1: addr.line1.trim(),
        city: addr.city.trim(),
        state: addr.state.trim(),
        pincode: addr.pincode.trim(),
      },
    };
  }

  async function placeOrder(event) {
    event.preventDefault();

    if (busy || lines.length === 0) return;

    setBusy(true);
    setError("");

    try {
      const payload = getOrderPayload();

      if (method === "cod") {
        const result = await api.createOrder({
          ...payload,
          paymentMethod: "cod",
        });

        const order = result.order || result;
        const orderId = order._id ?? order.id;

        if (!orderId) {
          throw new Error(
            "No order ID was returned. Please check My Orders before trying again."
          );
        }

        clearCart();
        navigate(`/orders/${orderId}/confirmed`);
        return;
      }

      if (method !== "upi" && method !== "card") {
        throw new Error("Please select a supported payment method.");
      }

      await loadRazorpay();

      // The server calculates the final amount and reserves stock.
      const paymentOrder = await api.createPaymentOrder(payload);

      if (
        !paymentOrder?.keyId ||
        !paymentOrder?.razorpayOrderId ||
        !paymentOrder?.orderId ||
        !Number.isFinite(Number(paymentOrder.amount))
      ) {
        throw new Error(
          "The server returned incomplete payment details. Please check My Orders before trying again."
        );
      }

      const verification = await openRazorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || "INR",
        name: "THE SNEAKER CO.",
        description: paymentOrder.description || "Sneaker purchase",
        order_id: paymentOrder.razorpayOrderId,

        prefill: {
          name: addr.name.trim(),
          contact: addr.phone.trim(),
          ...(paymentOrder.prefill || {}),
        },

        theme: {
          color: "#111111",
        },
      });

      const verifiedOrderId =
        verification?.orderId ||
        verification?.order?._id ||
        paymentOrder.orderId;

      if (!verifiedOrderId) {
        throw new Error(
          "Payment verification returned no order ID. Please check My Orders."
        );
      }

      // Only clear the cart after server-side verification succeeds.
      clearCart();
      navigate(`/orders/${verifiedOrderId}/confirmed`);
    } catch (err) {
      setError(
        err.message || "Unable to complete checkout. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <main className="checkout-empty">
        <h1>Your bag is empty</h1>
        <p>Add some sneakers before checking out.</p>
        <Link to="/catalog" className="btn">
          Shop the catalog
        </Link>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <PageHeader title="Checkout" />

      <form onSubmit={placeOrder} className="checkout-form">
        <div className="checkout-details">
          <section className="checkout-section">
            <h2>Delivery address</h2>

            <div className="checkout-address-grid">
              <Field
                label="Full name"
                required
                value={addr.name}
                onChange={set("name")}
              />

              <Field
                label="Phone"
                type="tel"
                required
                value={addr.phone}
                onChange={set("phone")}
              />

              <div className="checkout-full-width">
                <Field
                  label="Address"
                  required
                  value={addr.line1}
                  onChange={set("line1")}
                />
              </div>

              <Field
                label="City"
                required
                value={addr.city}
                onChange={set("city")}
              />

              <Field
                label="State"
                required
                value={addr.state}
                onChange={set("state")}
              />

              <Field
                label="Pincode"
                required
                value={addr.pincode}
                onChange={set("pincode")}
              />
            </div>
          </section>

          <section className="checkout-section">
            <h2>Payment method</h2>

            <div className="checkout-payment-options">
              {[
                { value: "upi", label: "UPI" },
                { value: "card", label: "Credit / debit card" },
                {
                  value: "wallet",
                  label: "Wallet balance (coming soon)",
                  disabled: true,
                },
                { value: "cod", label: "Cash on delivery" },
              ].map(({ value, label, disabled = false }) => (
                <label
                  key={value}
                  className={`checkout-payment-option ${
                    method === value ? "is-selected" : ""
                  } ${disabled ? "is-disabled" : ""}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={value}
                    checked={method === value}
                    disabled={disabled || busy}
                    onChange={() => {
                      setMethod(value);
                      setError("");
                    }}
                  />

                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="checkout-summary">
          <h2>Order summary</h2>

          <div className="checkout-items">
            {lines.map((line) => (
              <div
                key={`${line.id}-${line.size}`}
                className="checkout-item"
              >
                <span>
                  {line.product.name} (UK {line.size}) × {line.qty}
                </span>

                <span>{money(line.product.price * line.qty)}</span>
              </div>
            ))}
          </div>

          <div className="checkout-total">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>

          <section className="checkout-coupon">
            <h3>Promo code</h3>

            {coupon ? (
              <div className="checkout-coupon-applied">
                <div>
                  <span className="checkout-coupon-applied-code">
                    {coupon.code}
                  </span>
                  <strong>− {money(coupon.discount)}</strong>
                </div>

                <button
                  type="button"
                  disabled={busy || couponBusy}
                  onClick={() => {
                    setCoupon(null);
                    setCouponInput("");
                    setCouponError("");
                  }}
                  aria-label={`Remove promo code ${coupon.code}`}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="checkout-coupon-entry">
                  <input
                    id="checkout-coupon-code"
                    aria-label="Promo code"
                    value={couponInput}
                    disabled={busy || couponBusy}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyCoupon();
                      }
                    }}
                    onChange={(event) => {
                      setCouponInput(event.target.value);
                      setCouponError("");
                    }}
                    placeholder="Enter code"
                    autoComplete="off"
                  />

                  <button
                    type="button"
                    onClick={() => applyCoupon()}
                    disabled={
                      busy || couponBusy || !couponInput.trim()
                    }
                  >
                    {couponBusy ? "Applying..." : "Apply"}
                  </button>
                </div>

                {couponError && (
                  <p className="checkout-coupon-error" role="alert">
                    {couponError}
                  </p>
                )}

                <div className="checkout-available-coupons">
                  <p className="checkout-available-heading">
                    Available offers
                  </p>

                  {couponsLoading ? (
                    <p className="checkout-coupon-note">
                      Loading available coupons…
                    </p>
                  ) : couponsLoadError ? (
                    <p className="checkout-coupon-note" role="status">
                      {couponsLoadError} You can still enter a code above.
                    </p>
                  ) : availableCoupons.length === 0 ? (
                    <p className="checkout-coupon-note">
                      No active coupons available right now.
                    </p>
                  ) : (
                    <div className="checkout-coupon-list">
                      {availableCoupons.map((item) => {
                        const minimum = Number(item.minOrder) || 0;
                        const meetsMinimum = subtotal >= minimum;

                        return (
                          <div
                            className="checkout-coupon-option"
                            key={item.code}
                          >
                            <div className="checkout-coupon-option-info">
                              <strong>{item.code}</strong>
                              <span>{couponDescription(item)}</span>

                              {minimum > 0 && (
                                <small>
                                  Minimum order {money(minimum)}
                                </small>
                              )}

                              {!meetsMinimum && (
                                <small className="checkout-coupon-minimum">
                                  Add {money(minimum - subtotal)} more to use
                                </small>
                              )}

                              {item.expiresAt && (
                                <small>
                                  Expires{" "}
                                  {new Date(item.expiresAt).toLocaleDateString(
                                    "en-IN"
                                  )}
                                </small>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={
                                busy ||
                                couponBusy ||
                                !meetsMinimum
                              }
                              onClick={() => {
                                setCouponInput(item.code);
                                applyCoupon(item.code);
                              }}
                            >
                              Apply
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          {coupon && (
            <div className="checkout-total checkout-discount-row">
              <span>Coupon discount</span>
              <span>− {money(coupon.discount)}</span>
            </div>
          )}

          <div className="checkout-total checkout-grand-total">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>

          {error && (
            <p className="checkout-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="checkout-place-order"
            disabled={busy || couponBusy}
          >
            {busy
              ? method === "cod"
                ? "Placing order..."
                : "Processing payment..."
              : method === "cod"
                ? "Place Order"
                : "Pay Now"}
          </button>

          <p className="checkout-terms">
            Please verify your delivery address before placing your order.
          </p>

          <Link to="/cart" className="checkout-back-link">
            Return to bag
          </Link>
        </aside>
      </form>
    </main>
  );
}
