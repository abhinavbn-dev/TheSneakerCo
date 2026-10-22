
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import PageHeader from '../components/PageHeader.jsx';
import { orders as fallbackOrders } from '../data/products.js';
import { api } from '../services/api.js';
import { money } from '../utils.js';
import './OrderTracker.css';

const STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '');

const formatDate = (value, includeTime = false) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('en-IN', includeTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? money(amount) : '—';
};

const humanize = (value) =>
  String(value || '—')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getItems = (order) => {
  const items = firstValue(order?.items, order?.orderItems, order?.products, order?.cartItems);
  return Array.isArray(items) ? items : [];
};

const getProductName = (item) =>
  firstValue(item.productName, item.name, item.title, item.product?.name, item.product?.title, 'Product');

const getImage = (item) =>
  firstValue(
    item.image,
    item.imageUrl,
    item.thumbnail,
    item.productImage,
    item.product?.image,
    item.product?.images?.[0],
    item.images?.[0],
  );

const getQuantity = (item) => {
  const quantity = Number(firstValue(item.quantity, item.qty, 1));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
};

const getUnitPrice = (item) => {
  const price = Number(firstValue(item.price, item.unitPrice, item.product?.price, 0));
  return Number.isFinite(price) ? price : 0;
};

function DetailRow({ label, value, strong = false }) {
  if (value === undefined || value === null || value === '') return null;

  return (
    <div className={`ot-detail-row${strong ? ' ot-detail-row-strong' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function InfoCard({ title, eyebrow, children, className = '' }) {
  return (
    <section className={`ot-card ${className}`}>
      <div className="ot-card-heading">
        {eyebrow && <p className="ot-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || 'Pending').toLowerCase();

  const variant = normalized.includes('cancel')
    ? 'cancelled'
    : normalized.includes('deliver')
      ? 'delivered'
      : normalized.includes('fail') || normalized.includes('refund')
        ? 'attention'
        : normalized.includes('ship') || normalized.includes('process') || normalized.includes('confirm')
          ? 'progress'
          : 'pending';

  return <span className={`ot-status ot-status-${variant}`}>{humanize(status || 'Pending')}</span>;
}

function ShippingAddress({ order }) {
  const address = firstValue(order.shippingAddress, order.deliveryAddress, order.address, order.shipping, {});
  const customer = firstValue(order.shippingName, address?.fullName, address?.name, order.customerName, order.user?.name);
  const phone = firstValue(address?.phone, address?.phoneNumber, order.shippingPhone, order.phone);
  const lines = [
    address?.addressLine1,
    address?.addressLine2,
    address?.street,
    address?.landmark,
    [address?.city, address?.state, address?.postalCode || address?.pincode || address?.zip].filter(Boolean).join(', '),
    address?.country,
  ].filter(Boolean);

  const isTextAddress = typeof address === 'string';

  if (!customer && !phone && !lines.length && !isTextAddress) {
    return <p className="ot-muted">Shipping address is not available for this order.</p>;
  }

  return (
    <div className="ot-address">
      {customer && <p className="ot-address-name">{customer}</p>}
      {isTextAddress && <p>{address}</p>}
      {lines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
      {phone && <p className="ot-address-phone">Phone: {phone}</p>}
    </div>
  );
}

export default function OrderTracker() {
  const { id } = useParams();
  const navigate = useNavigate();

  const fallback = useMemo(
    () => fallbackOrders.find((item) => String(item.id ?? item._id) === String(id)),
    [id],
  );

  const [order, setOrder] = useState(fallback || { id, status: 'Pending', total: 0 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await api.getOrder(id);
    const nextOrder = data?.order || data?.data?.order || data?.data || data;
    setOrder(nextOrder || fallback || { id, status: 'Pending', total: 0 });
    return nextOrder;
  }, [id, fallback]);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError('');

    api.getOrder(id)
      .then((data) => {
        if (!alive) return;
        setOrder(data?.order || data?.data?.order || data?.data || data);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || 'Could not load order details.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const cancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setBusy(true);
    setError('');

    try {
      await api.cancelOrder(id);
      await load();
    } catch (err) {
      setError(err.message || 'Could not cancel this order.');
    } finally {
      setBusy(false);
    }
  };

  const items = getItems(order);
  const status = firstValue(order.status, order.orderStatus, 'Pending');
  const normalizedStatus = String(status).toLowerCase();
  const cancelled = normalizedStatus.includes('cancel');
  const delivered = normalizedStatus.includes('deliver');
  const displayId = firstValue(order.orderNo, order.orderNumber, order.id, order._id, id);
  const createdAt = firstValue(order.createdAt, order.placedAt, order.orderDate, order.date);
  const paymentStatus = firstValue(order.paymentStatus, order.payment?.status);
  const paymentMethod = firstValue(
    order.paymentMethod,
    order.payment?.method,
    order.payment?.provider,
    order.paymentType,
  );
  const paymentReference = firstValue(
    order.transactionId,
    order.paymentId,
    order.payment?.transactionId,
    order.payment?.reference,
  );

  const subtotalRaw = firstValue(order.subtotal, order.subTotal, order.itemsSubtotal);
  const discountRaw = firstValue(order.discount, order.discountAmount, order.couponDiscount);
  const shippingRaw = firstValue(order.shippingCost, order.shippingFee, order.deliveryFee);
  const taxRaw = firstValue(order.tax, order.taxAmount, order.gst);
  const walletRaw = firstValue(order.walletAmount, order.balanceUsed, order.walletDeduction);
  const totalRaw = firstValue(order.total, order.totalAmount, order.grandTotal, order.amount, order.amountPaid);

  const itemSubtotal = items.reduce(
    (sum, item) => sum + getUnitPrice(item) * getQuantity(item),
    0,
  );

  const computedTotal = itemSubtotal
    + (Number(shippingRaw) || 0)
    + (Number(taxRaw) || 0)
    - (Number(discountRaw) || 0)
    - (Number(walletRaw) || 0);

  const total = totalRaw !== undefined ? Number(totalRaw) : computedTotal;
  const stepIndex = cancelled
    ? -1
    : delivered
      ? 3
      : normalizedStatus.includes('ship')
        ? 2
        : normalizedStatus.includes('process') || normalizedStatus.includes('confirm')
          ? 1
          : 0;

  return (
    <div className="ot-page">
      <PageHeader title={`Order details // #${displayId}`} />

      <div className="ot-topbar">
        <Link to="/orders" className="ot-back-link">Back to my orders</Link>
        <StatusBadge status={status} />
      </div>

      {error && <div className="ot-alert" role="alert">{error}</div>}

      {loading && (
        <div className="ot-loading" role="status">Loading your order details…</div>
      )}

      <section className="ot-summary">
        <div className="ot-summary-main">
          <p className="ot-eyebrow">ORDER REFERENCE</p>
          <h1>#{displayId}</h1>
          <p className="ot-muted">
            Placed on {formatDate(createdAt, true)}
          </p>
        </div>

        <div className="ot-summary-total">
          <span>Order total</span>
          <strong>{Number.isFinite(total) ? formatMoney(total) : '—'}</strong>
          {paymentStatus && <span>Payment: {humanize(paymentStatus)}</span>}
        </div>
      </section>

      {!cancelled && (
        <InfoCard title="Order progress" eyebrow="DELIVERY">
          <ol className="ot-timeline">
            {STEPS.map((step, index) => {
              const complete = stepIndex >= index;
              const active = stepIndex === index;

              return (
                <li className={`ot-timeline-step${complete ? ' is-complete' : ''}${active ? ' is-active' : ''}`} key={step}>
                  <span className="ot-timeline-marker">
                    {complete ? '✓' : index + 1}
                  </span>
                  <span className="ot-timeline-label">{step}</span>
                </li>
              );
            })}
          </ol>

          <p className="ot-muted ot-progress-note">
            {delivered
              ? 'Your order is marked as delivered.'
              : normalizedStatus.includes('ship')
                ? 'Your order has shipped.'
                : normalizedStatus.includes('process') || normalizedStatus.includes('confirm')
                  ? 'Your order is being prepared.'
                  : 'Your order has been received and is awaiting processing.'}
          </p>
        </InfoCard>
      )}

      {cancelled && (
        <div className="ot-cancelled-note">
          This order has been cancelled. Contact support if you need help with a refund.
        </div>
      )}

      <div className="ot-layout">
        <div className="ot-main-column">
          <InfoCard title={`Items ordered (${items.length})`} eyebrow="YOUR PURCHASE">
            {items.length ? (
              <div className="ot-items">
                {items.map((item, index) => {
                  const image = getImage(item);
                  const quantity = getQuantity(item);
                  const unitPrice = getUnitPrice(item);
                  const name = getProductName(item);
                  const brand = firstValue(item.brand, item.product?.brand);
                  const size = firstValue(item.size, item.selectedSize, item.variant?.size);
                  const color = firstValue(item.color, item.selectedColor, item.variant?.color);
                  const lineTotal = firstValue(item.total, item.lineTotal, item.subtotal);

                  return (
                    <article className="ot-item" key={item._id || item.id || `${name}-${index}`}>
                      <div className="ot-item-image">
                        {image
                          ? <img src={image} alt={name} />
                          : <span aria-hidden="true">SC</span>}
                      </div>

                      <div className="ot-item-info">
                        {brand && <p className="ot-item-brand">{brand}</p>}
                        <h3>{name}</h3>
                        <div className="ot-item-options">
                          {size && <span>Size: {size}</span>}
                          {color && <span>Color: {color}</span>}
                          <span>Qty: {quantity}</span>
                        </div>
                        <p className="ot-item-unit">{formatMoney(unitPrice)} each</p>
                      </div>

                      <strong className="ot-item-total">
                        {formatMoney(lineTotal !== undefined ? Number(lineTotal) : unitPrice * quantity)}
                      </strong>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="ot-muted">
                {loading
                  ? 'Order items will appear here once loaded.'
                  : 'Item details are not available in the order response.'}
              </p>
            )}
          </InfoCard>

          <InfoCard title="Price breakdown" eyebrow="PAYMENT SUMMARY">
            <div className="ot-price-list">
              <DetailRow
                label="Subtotal"
                value={subtotalRaw !== undefined ? formatMoney(subtotalRaw) : items.length ? formatMoney(itemSubtotal) : null}
              />
              <DetailRow
                label="Discount"
                value={discountRaw !== undefined ? `− ${formatMoney(discountRaw)}` : null}
              />
              <DetailRow
                label="Shipping / delivery"
                value={shippingRaw !== undefined ? formatMoney(shippingRaw) : null}
              />
              <DetailRow
                label="Tax"
                value={taxRaw !== undefined ? formatMoney(taxRaw) : null}
              />
              <DetailRow
                label="Wallet / balance used"
                value={walletRaw !== undefined ? `− ${formatMoney(walletRaw)}` : null}
              />
              <div className="ot-price-divider" />
              <DetailRow
                label="Total"
                value={Number.isFinite(total) ? formatMoney(total) : '—'}
                strong
              />
            </div>
            <p className="ot-footnote">
              Only amounts provided by your order record are displayed. If a breakdown field is unavailable, it is omitted.
            </p>
          </InfoCard>
        </div>

        <aside className="ot-side-column">
          <InfoCard title="Delivery address" eyebrow="SHIP TO">
            <ShippingAddress order={order} />
            {firstValue(order.trackingNumber, order.trackingId, order.tracking?.number) && (
              <div className="ot-tracking-number">
                <span>Tracking number</span>
                <strong>{firstValue(order.trackingNumber, order.trackingId, order.tracking?.number)}</strong>
              </div>
            )}
            {firstValue(order.carrier, order.courier, order.tracking?.carrier) && (
              <div className="ot-tracking-number">
                <span>Courier</span>
                <strong>{firstValue(order.carrier, order.courier, order.tracking?.carrier)}</strong>
              </div>
            )}
            {firstValue(order.estimatedDelivery, order.estimatedDeliveryDate, order.tracking?.estimatedDelivery) && (
              <div className="ot-tracking-number">
                <span>Estimated delivery</span>
                <strong>{formatDate(firstValue(order.estimatedDelivery, order.estimatedDeliveryDate, order.tracking?.estimatedDelivery))}</strong>
              </div>
            )}
          </InfoCard>

          <InfoCard title="Payment details" eyebrow="TRANSACTION">
            <div className="ot-price-list">
              <DetailRow label="Payment method" value={paymentMethod ? humanize(paymentMethod) : null} />
              <DetailRow label="Payment status" value={paymentStatus ? <StatusBadge status={paymentStatus} /> : null} />
              <DetailRow label="Transaction reference" value={paymentReference} />
              <DetailRow label="Order date" value={createdAt ? formatDate(createdAt, true) : null} />
            </div>
            {!paymentMethod && !paymentStatus && !paymentReference && (
              <p className="ot-muted">Payment information is not available for this order.</p>
            )}
          </InfoCard>

          <InfoCard title="Order actions" eyebrow="NEED HELP?">
            <div className="ot-actions">
              {['Pending', 'Processing'].includes(status) && (
                <button
                  type="button"
                  className="ot-button ot-button-outline"
                  disabled={busy}
                  onClick={cancel}
                >
                  {busy ? 'Cancelling…' : 'Cancel order'}
                </button>
              )}

              <button
                type="button"
                className="ot-button ot-button-dark"
                onClick={() => navigate('/orders')}
              >
                Back to my orders
              </button>

              {normalizedStatus.includes('fail') && (
                <button
                  type="button"
                  className="ot-button ot-button-outline"
                  onClick={() => navigate('/checkout')}
                >
                  Retry payment
                </button>
              )}
            </div>

            <p className="ot-footnote">
              Returns and address changes depend on your order status and the options currently supported by the store.
            </p>
          </InfoCard>
        </aside>
      </div>
    </div>
  );
}
