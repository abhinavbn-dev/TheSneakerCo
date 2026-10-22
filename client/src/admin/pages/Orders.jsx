import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, DataTable, PageHeader, Pager, Panel, SearchBar, Stat, Tabs, usePaged } from '../components/ui';
import { inr } from '../data/adminData';
import { api } from '../../services/api.js';

const FILTERS = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const NEXT = { Pending: 'Processing', Processing: 'Shipped', Shipped: 'Delivered' };
function toRow(order) {
  return { ...order, id: String(order.id || order._id), displayId: order.orderNo || order.id || order._id, customer: order.user?.name || 'Customer', item: (order.items || []).map((item) => item.name).filter(Boolean).join(', ') || 'Sneakers', date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—', payment: order.payment || 'Pending' };
}

export default function Orders() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, processing: 0, shipped: 0, revenue: 0 });
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => {
    try {
      const data = await api.getAdminOrders({ limit: 100 });
      setRows((data.items || []).map(toRow)); setSummary(data.summary || summary); setError('');
    } catch (err) { setError(err.message || 'Could not load orders.'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const advance = async (row) => {
    const status = NEXT[row.status];
    if (!status) return;
    setBusyId(row.id); setError('');
    try { await api.updateOrderStatus(row.id, status); await load(); }
    catch (err) { setError(err.message || 'Could not update the order.'); }
    finally { setBusyId(''); }
  };
  const filtered = useMemo(() => rows.filter((order) => (filter === 'All' || order.status === filter) && `${order.displayId} ${order.customer} ${order.item}`.toLowerCase().includes(q.toLowerCase())), [rows, q, filter]);
  const paged = usePaged(filtered);

  return <>
    <PageHeader title="Orders & fulfilment" subtitle="Track, pack and dispatch every order" actions={<Button onClick={() => window.print()}>Print / export</Button>} />
    {error && <p role="alert" className="sc-orders-0165">{error}</p>}
    <div className="sc-orders-0166">
      <Stat label="Total orders" value={summary.total.toLocaleString('en-IN')} />
      <Stat label="Pending" value={summary.pending.toLocaleString('en-IN')} accent />
      <Stat label="Processing" value={summary.processing.toLocaleString('en-IN')} />
      <Stat label="Shipped" value={summary.shipped.toLocaleString('en-IN')} />
      <Stat label="Paid revenue" value={inr(summary.revenue)} />
    </div>
    <Panel className="sc-orders-0167">
      <div className="sc-orders-0168"><SearchBar value={q} onChange={setQ} placeholder="Search order, customer or item" /><Tabs tabs={FILTERS} value={filter} onChange={setFilter} /></div>
      <DataTable rowKey="id" rows={paged.slice} columns={[
        { label: 'Order', render: (order) => <span className="font-mono-ui sc-orders-0169">{order.displayId}</span> },
        { label: 'Customer', key: 'customer' }, { label: 'Item', key: 'item' }, { label: 'Date', key: 'date' },
        { label: 'Total', align: 'right', render: (order) => inr(order.total) },
        { label: 'Payment', render: (order) => <Badge>{order.payment}</Badge> },
        { label: 'Status', render: (order) => <Badge>{order.status}</Badge> },
        { label: 'Actions', align: 'right', render: (order) => NEXT[order.status] ? <Button disabled={busyId === order.id} onClick={() => advance(order)}>{busyId === order.id ? 'Saving…' : `Mark ${NEXT[order.status]}`}</Button> : <span className="sc-orders-0170">—</span> },
      ]} />
      <Pager {...paged} />
    </Panel>
  </>;
}
