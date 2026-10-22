import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, DataTable, PageHeader, Pager, Panel, SearchBar, Stat, Tabs, usePaged } from '../components/ui';
import { inr } from '../data/adminData';
import { api } from '../../services/api.js';

const TIERS = ['All', 'Tier 1', 'Tier 2', 'Tier 3'];
export default function Customers() {
  const [rows, setRows] = useState([]); const [summary, setSummary] = useState({ registered: 0, flagged: 0, newThisWeek: 0 });
  const [q, setQ] = useState(''); const [tier, setTier] = useState('All'); const [error, setError] = useState(''); const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => {
    try { const data = await api.getAdminCustomers({ limit: 100 }); setRows((data.items || []).map((user) => ({ ...user, id: String(user.id || user._id) }))); setSummary(data.summary || summary); setError(''); }
    catch (err) { setError(err.message || 'Could not load customers.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const changeStatus = async (user) => {
    const status = user.status === 'Blocked' ? 'Active' : 'Blocked';
    setBusyId(user.id); setError('');
    try { await api.updateCustomer(user.id, { status }); await load(); }
    catch (err) { setError(err.message || 'Could not update customer.'); }
    finally { setBusyId(''); }
  };
  const filtered = useMemo(() => rows.filter((user) => (tier === 'All' || user.tier === tier) && `${user.name} ${user.email} ${user.city || ''}`.toLowerCase().includes(q.toLowerCase())), [rows, tier, q]);
  const paged = usePaged(filtered);
  return <>
    <PageHeader title="Customers" subtitle="Registered buyers and account status" actions={<Button onClick={() => window.print()}>Print / export</Button>} />
    {error && <p role="alert" className="sc-customers-0118">{error}</p>}
    <div className="sc-customers-0119"><Stat label="Registered" value={summary.registered.toLocaleString('en-IN')} /><Stat label="Verified emails" value={rows.filter((user) => user.isEmailVerified).length.toLocaleString('en-IN')} /><Stat label="Flagged" value={summary.flagged.toLocaleString('en-IN')} accent /><Stat label="New this week" value={summary.newThisWeek.toLocaleString('en-IN')} /></div>
    <Panel className="sc-customers-0120">
      <div className="sc-customers-0121"><SearchBar value={q} onChange={setQ} placeholder="Search name, email or city" /><Tabs tabs={TIERS} value={tier} onChange={setTier} /></div>
      <DataTable rowKey="id" rows={paged.slice} columns={[
        { label: 'Customer', render: (user) => <div><p className="sc-customers-0122">{user.name}</p><p className="sc-customers-0123">{user.email}</p></div> },
        { label: 'City', key: 'city' }, { label: 'Tier', key: 'tier' }, { label: 'Orders', key: 'orders' },
        { label: 'Lifetime spend', align: 'right', render: (user) => inr(user.spent || 0) }, { label: 'Status', render: (user) => <Badge>{user.status}</Badge> },
        { label: 'Action', align: 'right', render: (user) => <Button variant={user.status === 'Blocked' ? 'primary' : 'danger'} disabled={busyId === user.id} onClick={() => changeStatus(user)}>{user.status === 'Blocked' ? 'Unblock' : 'Block'}</Button> },
      ]} />
      <Pager {...paged} />
    </Panel>
  </>;
}
