import { Link } from "react-router";
import { ProductImage } from "../components/ProductCard.jsx";
import { useCart } from "../context/CartContext.jsx";
import { money } from "../utils.js";
import "./Cart.css";

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export default function Cart() {
  const {
    lines,
    subtotal,
    count,
    wishlist,
    setQty,
    removeItem,
    toggleWish,
  } = useCart();
  const total = subtotal;

  if (lines.length === 0) {
    return (
      <div className="cart-page cart-empty">
        <h1>Your bag</h1>
        <p>Your bag is empty.</p>
        <Link to="/catalog" className="cart-empty-link">
          Shop the catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="cart-heading">
        <h1>Bag</h1>
        <p>
          {count} {count === 1 ? "item" : "items"} <span aria-hidden="true">|</span>{" "}
          {money(total)}
        </p>
      </header>

      <ul className="cart-items">
        {lines.map(({ id, product, size, qty }) => {
          const productId = String(product.id ?? id);
          const saved = wishlist.some((item) => String(item) === productId);
          const category =
            product.gender === "men"
              ? "Men's Shoes"
              : product.gender === "women"
                ? "Women's Shoes"
                : product.brand || "Shoes";

          return (
            <li key={`${productId}-${size}`} className="cart-item">
              <Link
                to={`/product/${productId}`}
                className="cart-item-image-link"
                aria-label={`View ${product.name}`}
              >
                <ProductImage
                  product={product}
                  className="cart-item-image"
                />
              </Link>

              <div className="cart-item-details">
                <div className="cart-item-info">
                  <Link
                    to={`/product/${productId}`}
                    className="cart-item-name"
                  >
                    {product.name}
                  </Link>
                  <p className="cart-item-category">{category}</p>
                  <p className="cart-item-size">Size UK {size}</p>
                </div>

                <p className="cart-item-price">
                  {money(Number(product.price || 0) * qty)}
                </p>

                <div className="cart-item-actions">
                  <div
                    className="cart-quantity"
                    aria-label={`Quantity: ${qty}`}
                  >
                    <button
                      type="button"
                      onClick={() => setQty(productId, size, qty - 1)}
                      aria-label={`Decrease quantity of ${product.name}`}
                    >
                      −
                    </button>
                    <span aria-live="polite">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(productId, size, qty + 1)}
                      aria-label={`Increase quantity of ${product.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="cart-icon-button"
                    onClick={() => toggleWish(productId)}
                    aria-label={
                      saved
                        ? `Remove ${product.name} from wishlist`
                        : `Add ${product.name} to wishlist`
                    }
                    aria-pressed={saved}
                  >
                    <HeartIcon filled={saved} />
                  </button>

                  <button
                    type="button"
                    className="cart-icon-button"
                    onClick={() => removeItem(productId, size)}
                    aria-label={`Remove ${product.name} from bag`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="cart-summary" aria-labelledby="cart-summary-title">
        <h2 id="cart-summary-title">Summary</h2>
        <div className="cart-summary-row">
          <span>Bag Total</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Sub Total</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Shipping Charges</span>
          <span className="cart-shipping-free">Free</span>
        </div>
        <div className="cart-summary-total">
          <span>You Pay</span>
          <span>{money(total)}</span>
        </div>
        <Link to="/checkout" className="cart-promo-link">
          <span className="cart-promo-icon" aria-hidden="true">%</span>
          <span className="cart-promo-copy">
            <strong>Have a promo code?</strong>
            <small>Apply now to get instant savings</small>
          </span>
          <span className="cart-promo-chevron" aria-hidden="true">›</span>
        </Link>
        <Link to="/checkout" className="cart-checkout-button">
          Proceed to Buy
        </Link>
      </section>
    </div>
  );
}
