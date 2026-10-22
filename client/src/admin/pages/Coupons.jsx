import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, DataTable, PageHeader, Panel, ProgressBar, Stat } from '../components/ui';
import { api } from '../../services/api.js';

const blank = { code: '', type: 'percent', value: '10', limit: '500', minOrder: '0', expiresAt: '', isActive: false };
const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : '—';
const formatDiscount = (coupon) => coupon.type === 'flat' ? `₹${Number(coupon.value).toLocaleString('en-IN')} off` : `${coupon.value}% off`;
export default function Coupons() {
  const [rows, setRows] = useState([]); const [summary, setSummary] = useState({ active: 0, redemptions: 0, expiringSoon: 0 });
  const [form, setForm] = useState(blank); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const data = await api.getCoupons(); setRows((data.items || []).map((item) => ({ ...item, id: String(item.id || item._id) }))); setSummary(data.summary || summary); setError(''); }
    catch (err) { setError(err.message || 'Could not load coupons.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const addCoupon = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api.createCoupon({ code: form.code.trim().toUpperCase(), type: form.type, value: Number(form.value), limit: Number(form.limit), minOrder: Number(form.minOrder), expiresAt: form.expiresAt || undefined, isActive: false });
      setForm(blank); await load();
    } catch (err) { setError(err.message || 'Could not create coupon.'); }
    finally { setBusy(false); }
  };
  const toggle = async (coupon) => {
    try { await api.updateCoupon(coupon.id, { isActive: coupon.status !== 'Active' }); await load(); }
    catch (err) { setError(err.message || 'Could not update coupon.'); }
  };
  const remove = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    try { await api.deleteCoupon(coupon.id); await load(); }
    catch (err) { setError(err.message || 'Could not delete coupon.'); }
  };
  return <>
    <PageHeader title="Coupons & promotions" subtitle="Discount codes and redemption limits" />
    {error && <p role="alert" className="sc-coupons-0096">{error}</p>}
    <div className="sc-coupons-0097"><Stat label="Active codes" value={summary.active} /><Stat label="Redemptions" value={summary.redemptions} /><Stat label="Expiring soon" value={summary.expiringSoon} accent /></div>
    <Panel title="Create coupon" className="sc-coupons-0098">
      <form onSubmit={addCoupon} className="sc-coupons-0099">
        <label className="sc-coupons-0100">Coupon code *<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={32} placeholder="WELCOME10" className="sc-coupons-0101" /></label>
        <label className="sc-coupons-0102">Discount type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="sc-coupons-0103"><option value="percent">Percentage</option><option value="flat">Flat ₹</option></select></label>
        <label className="sc-coupons-0104">Discount value *<input required type="number" min="1" step="1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="sc-coupons-0105" /></label>
        <label className="sc-coupons-0106">Usage limit<input required type="number" min="1" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} className="sc-coupons-0107" /></label>
        <label className="sc-coupons-0108">Minimum order (₹)<input type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} className="sc-coupons-0109" /></label>
        <label className="sc-coupons-0110">Expiry date<input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="sc-coupons-0111" /></label>
        <div className="sc-coupons-0112"><Button type="submit" variant="primary" disabled={busy}>{busy ? 'Saving…' : 'Save as draft'}</Button></div>
      </form>
    </Panel>
    <Panel className="sc-coupons-0113">
      <DataTable rowKey="id" rows={rows} columns={[
        { label: 'Code', render: (coupon) => <span className="font-mono-ui sc-coupons-0114">{coupon.code}</span> },
        { label: 'Discount', render: (coupon) => formatDiscount(coupon) },
        { label: 'Usage', render: (coupon) => <div className="sc-coupons-0115"><ProgressBar value={coupon.limit ? (coupon.used / coupon.limit) * 100 : 0} /><p className="sc-coupons-0116">{coupon.used} / {coupon.limit}</p></div> },
        { label: 'Expires', render: (coupon) => formatDate(coupon.expiresAt) }, { label: 'Status', render: (coupon) => <Badge>{coupon.status}</Badge> },
        { label: 'Actions', align: 'right', render: (coupon) => <div className="sc-coupons-0117">{coupon.status !== 'Expired' && <Button onClick={() => toggle(coupon)}>{coupon.status === 'Active' ? 'Pause' : 'Activate'}</Button>}<Button variant="danger" onClick={() => remove(coupon)}>Delete</Button></div> },
      ]} />
    </Panel>
  </>;
}
