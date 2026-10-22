import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Badge, DataTable, Panel, PageHeader, ProgressBar, Stat } from '../components/ui';
import { inr } from '../data/adminData';
import { api } from '../../services/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState({ monthRevenue: 0, ordersToday: 0, awaitingDispatch: 0, customers: 0, recentOrders: [], lowStock: [] });
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    Promise.all([api.getDashboardStats(), api.getAdminProducts({ status: 'Low stock', limit: 100 })])
      .then(([dashboard, inventory]) => alive && setStats({ ...dashboard, lowStock: inventory.items || inventory.products || [] }))
      .catch((err) => alive && setError(err.message || 'Could not load dashboard data.'));
    return () => { alive = false; };
  }, []);
  const recentRows = (stats.recentOrders || []).map((order) => ({
    ...order, id: order.orderNo || order.id || order._id,
    customer: order.user?.name || 'Customer',
    item: (order.items || []).map((item) => item.name).filter(Boolean).join(', ') || 'Sneakers',
  }));
  const lowStock = (stats.lowStock || []).slice(0, 5);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Bengaluru operations and fulfilment overview" />
      {error && <p role="alert" className="sc-dashboard-0124">{error}</p>}
      <div className="sc-dashboard-0125">
        <Stat label="Total revenue" value={inr(stats.monthRevenue)} hint="Paid orders this month" />
        <Stat label="Orders today" value={stats.ordersToday.toLocaleString('en-IN')} hint={`${stats.awaitingDispatch} awaiting dispatch`} />
        <Stat label="Active customers" value={stats.customers.toLocaleString('en-IN')} hint="Registered customer accounts" />
        <Stat label="Awaiting dispatch" value={stats.awaitingDispatch.toLocaleString('en-IN')} accent />
      </div>
      <div className="sc-dashboard-0126">
        <Panel title="Recent orders" className="sc-dashboard-0127" action={<Link to="../orders" className="font-mono-ui sc-dashboard-0128">View all</Link>}>
          <DataTable rows={recentRows} columns={[
            { label: 'Order', render: (order) => <span className="font-mono-ui sc-dashboard-0129">{order.id}</span> },
            { label: 'Customer', key: 'customer' },
            { label: 'Item', key: 'item' },
            { label: 'Total', align: 'right', render: (order) => inr(order.total) },
            { label: 'Status', render: (order) => <Badge>{order.status}</Badge> },
          ]} />
        </Panel>
        <div className="sc-dashboard-0130">
          <Panel title="Stock health">
            <ul className="sc-dashboard-0131">
              {lowStock.length === 0 && <li className="sc-dashboard-0132">No low-stock products to report.</li>}
              {lowStock.map((product) => <li key={product.id || product._id} className="sc-dashboard-0133"><span>{product.name}</span><Badge tone={Number(product.stock) === 0 ? 'bad' : 'warn'}>{product.stock} left</Badge></li>)}
            </ul>
          </Panel>
          <Panel title="Stock thresholds">
            <ul className="sc-dashboard-0134">
              <li><div className="sc-dashboard-0135"><span>Healthy stock</span><span className="sc-dashboard-0136">11+ units</span></div><ProgressBar value={100} /></li>
              <li><div className="sc-dashboard-0137"><span>Low stock alert</span><span className="sc-dashboard-0138">1–10 units</span></div><ProgressBar value={40} tone="sc-dashboard-0139" /></li>
              <li><div className="sc-dashboard-0140"><span>Out of stock</span><span className="sc-dashboard-0141">0 units</span></div><ProgressBar value={10} tone="sc-dashboard-0142" /></li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
