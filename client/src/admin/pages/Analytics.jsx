import { useEffect, useState } from 'react';
import { DataTable, PageHeader, Panel, Stat } from '../components/ui';
import { inr } from '../data/adminData';
import { api } from '../../services/api.js';

export default function Analytics() {
  const [data, setData] = useState({ gross: 0, refunds: 0, net: 0, months: [], topProducts: [] }); const [error, setError] = useState('');
  useEffect(() => { let alive = true; api.getAnalytics().then((result) => alive && setData(result)).catch((err) => alive && setError(err.message || 'Could not load analytics.')); return () => { alive = false; }; }, []);
  const months = data.months || []; const max = Math.max(1, ...months.map((month) => Number(month.revenue) || 0));
  return <>
    <PageHeader title="Sales & revenue audit" subtitle="Financial performance based on recorded paid orders" />
    {error && <p role="alert" className="sc-analytics-0072">{error}</p>}
    <div className="sc-analytics-0073"><Stat label="Gross revenue" value={inr(data.gross)} /><Stat label="Net paid revenue" value={inr(data.net)} /><Stat label="Refunds" value={inr(data.refunds)} accent /></div>
    <div className="sc-analytics-0074">
      <Panel title="Monthly revenue (₹)" className="sc-analytics-0075"><div className="sc-analytics-0076" role="img" aria-label="Monthly revenue bar chart">
        {months.map((month) => <div key={`${month.label}-${month.revenue}`} className="sc-analytics-0077"><span className="sc-analytics-0078">{Math.round(month.revenue).toLocaleString('en-IN')}</span><div className="sc-analytics-0079" style={{ height: `${Math.max(2, (month.revenue / max) * 100)}%` }} /><span className="font-mono-ui sc-analytics-0080">{month.label}</span></div>)}
        {months.length === 0 && <p className="sc-analytics-0081">No paid-order data is available yet.</p>}
      </div></Panel>
      <Panel title="Top performing products"><DataTable rowKey="name" rows={data.topProducts || []} columns={[{ label: 'Product', key: 'name' }, { label: 'Units', align: 'right', key: 'units' }, { label: 'Revenue', align: 'right', render: (product) => inr(product.revenue) }]} /></Panel>
    </div>
  </>;
}
