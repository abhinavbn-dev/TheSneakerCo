import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import PageHeader from '../components/PageHeader.jsx';
import { api } from '../services/api.js';
import { money } from '../utils.js';

export default function MyOrders() {
  const [orders, setOrders] = useState([]); const [error, setError] = useState('');
  useEffect(() => { let alive = true; api.getOrders().then((data) => alive && setOrders(Array.isArray(data) ? data : data.orders || [])).catch((err) => alive && setError(err.message || 'Could not load orders.')); return () => { alive = false; }; }, []);
  return <><PageHeader title="My orders // Archive ledger" />{error && <p role="alert" className="sc-myorders-0333">{error}</p>}<ul className="sc-myorders-0334">{orders.map((order) => { const id = order.id || order._id; return <li key={id} className="card sc-myorders-0335"><div><p className="sc-myorders-0336">#{order.orderNo || id}</p><p className="sc-myorders-0337">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—'} · {order.status}</p></div><p className="sc-myorders-0338">{money(order.total || 0)}</p><Link to={`/orders/${id}`} className="btn-outline">Track order</Link></li>; })}{!orders.length && !error && <li className="card sc-myorders-0339">No orders yet.</li>}</ul></>;
}
