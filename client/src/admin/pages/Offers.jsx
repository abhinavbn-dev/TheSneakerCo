import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, PageHeader, Panel, Stat, Tabs } from '../components/ui';
import { inr } from '../data/adminData';
import { api } from '../../services/api.js';

const FILTERS = ['All', 'Live', 'Scheduled', 'Draft'];
export default function Offers() {
  const [rows, setRows] = useState([]); const [summary, setSummary] = useState({ live: 0, scheduled: 0, revenue: 0 });
  const [filter, setFilter] = useState('All'); const [name, setName] = useState(''); const [detail, setDetail] = useState(''); const [showForm, setShowForm] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { const data = await api.getOffers(); setRows((data.items || []).map((offer) => ({ ...offer, id: String(offer.id || offer._id) }))); setSummary(data.summary || summary); setError(''); }
    catch (err) { setError(err.message || 'Could not load offers.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const addOffer = async (event) => {
    event.preventDefault();
    try { await api.createOffer({ name: name.trim(), detail: detail.trim(), status: 'Draft' }); setName(''); setDetail(''); setShowForm(false); await load(); }
    catch (err) { setError(err.message || 'Could not create offer.'); }
  };
  const changeStatus = async (offer) => {
    const next = offer.status === 'Live' ? 'Draft' : 'Live';
    try { await api.updateOffer(offer.id, { status: next }); await load(); }
    catch (err) { setError(err.message || 'Could not update offer.'); }
  };
  const duplicate = async (offer) => {
    try { await api.createOffer({ name: `${offer.name} (Copy)`, detail: offer.detail, status: 'Draft' }); await load(); }
    catch (err) { setError(err.message || 'Could not duplicate offer.'); }
  };
  const remove = async (offer) => {
    if (!window.confirm(`Delete campaign “${offer.name}”?`)) return;
    try { await api.deleteOffer(offer.id); await load(); }
    catch (err) { setError(err.message || 'Could not delete offer.'); }
  };
  const shown = rows.filter((offer) => filter === 'All' || offer.status === filter);
  return <>
    <PageHeader title="Offers & campaigns" subtitle="Seasonal drops, bundles and member perks" actions={<Button variant="primary" onClick={() => setShowForm((value) => !value)}>New campaign</Button>} />
    {error && <p role="alert" className="sc-offers-0143">{error}</p>}
    <div className="sc-offers-0144"><Stat label="Live now" value={String(summary.live).padStart(2, '0')} /><Stat label="Campaign revenue" value={inr(summary.revenue)} /><Stat label="Scheduled" value={String(summary.scheduled).padStart(2, '0')} accent /></div>
    {showForm && <Panel title="New campaign" className="sc-offers-0145"><form onSubmit={addOffer} className="sc-offers-0146"><label className="sc-offers-0147">Campaign name *<input required value={name} onChange={(e) => setName(e.target.value)} className="sc-offers-0148" /></label><label className="sc-offers-0149">Description<input value={detail} onChange={(e) => setDetail(e.target.value)} className="sc-offers-0150" /></label><div><Button type="submit" variant="primary">Save draft</Button></div></form></Panel>}
    <div className="sc-offers-0151"><Tabs tabs={FILTERS} value={filter} onChange={setFilter} /></div>
    <div className="sc-offers-0152">
      {shown.map((offer) => <Panel key={offer.id}><div className="sc-offers-0153"><div className="sc-offers-0154"><h3 className="font-display sc-offers-0155">{offer.name}</h3><Badge>{offer.status}</Badge></div><p className="sc-offers-0156">{offer.detail || 'No campaign description yet.'}</p><dl className="sc-offers-0157"><div><dt className="font-mono-ui sc-offers-0158">Revenue</dt><dd className="sc-offers-0159">{inr(offer.revenue || 0)}</dd></div><div className="sc-offers-0160"><dt className="font-mono-ui sc-offers-0161">Ends</dt><dd className="sc-offers-0162">{offer.endsAt ? new Date(offer.endsAt).toLocaleDateString('en-IN') : '—'}</dd></div></dl><div className="sc-offers-0163"><Button onClick={() => changeStatus(offer)}>{offer.status === 'Live' ? 'Pause' : 'Publish'}</Button><Button onClick={() => duplicate(offer)}>Duplicate</Button><Button variant="danger" onClick={() => remove(offer)}>Delete</Button></div></div></Panel>)}
    </div>
    {shown.length === 0 && <p className="sc-offers-0164">No campaigns in this status yet.</p>}
  </>;
}
