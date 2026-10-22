import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, DataTable, PageHeader, Panel, SearchBar, Stat } from '../components/ui';
import { api } from '../../services/api.js';

export default function Categories() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState(''); const [newName, setNewName] = useState(''); const [newDesc, setNewDesc] = useState(''); const [showForm, setShowForm] = useState(false); const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { const data = await api.getAdminCategories(); setRows((data || []).map((row) => ({ ...row, id: String(row.id || row._id) }))); setError(''); }
    catch (err) { setError(err.message || 'Could not load collections.'); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const add = async (event) => { event.preventDefault(); try { await api.createCategory({ name: newName.trim(), desc: newDesc.trim(), status: 'Live' }); setNewName(''); setNewDesc(''); setShowForm(false); await load(); } catch (err) { setError(err.message || 'Could not create collection.'); } };
  const toggle = async (row) => { try { await api.updateCategory(row.id, { status: row.status === 'Live' ? 'Hidden' : 'Live' }); await load(); } catch (err) { setError(err.message || 'Could not update collection.'); } };
  const remove = async (row) => { if (!window.confirm(`Delete “${row.name}”?`)) return; try { await api.deleteCategory(row.id); await load(); } catch (err) { setError(err.message || 'Could not delete collection.'); } };
  const shown = rows.filter((row) => row.name.toLowerCase().includes(q.toLowerCase()));
  return <>
    <PageHeader title="Collections" subtitle="Maintain optional storefront collection labels" actions={<Button variant="primary" onClick={() => setShowForm((value) => !value)}>New collection</Button>} />
    {error && <p role="alert" className="sc-categories-0082">{error}</p>}
    <div className="sc-categories-0083"><Stat label="Collections" value={rows.length} /><Stat label="Live" value={rows.filter((row) => row.status === 'Live').length} /><Stat label="Hidden" value={rows.filter((row) => row.status === 'Hidden').length} accent /></div>
    <p className="sc-categories-0084">Products are managed independently and do not require a category field.</p>
    {showForm && <Panel title="New collection" className="sc-categories-0085"><form onSubmit={add} className="sc-categories-0086"><label className="sc-categories-0087">Name *<input required value={newName} onChange={(e) => setNewName(e.target.value)} className="sc-categories-0088" /></label><label className="sc-categories-0089">Description<input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="sc-categories-0090" /></label><div><Button variant="primary" type="submit">Create collection</Button></div></form></Panel>}
    <Panel className="sc-categories-0091"><div className="sc-categories-0092"><SearchBar value={q} onChange={setQ} placeholder="Search collections" /></div><DataTable rowKey="id" rows={shown} columns={[
      { label: 'Collection', render: (row) => <div><p className="sc-categories-0093">{row.name}</p><p className="sc-categories-0094">{row.desc}</p></div> },
      { label: 'Products', render: (row) => row.products ?? '—' }, { label: 'Status', render: (row) => <Badge>{row.status}</Badge> },
      { label: 'Actions', align: 'right', render: (row) => <div className="sc-categories-0095"><Button onClick={() => toggle(row)}>{row.status === 'Live' ? 'Hide' : 'Publish'}</Button><Button variant="danger" onClick={() => remove(row)}>Delete</Button></div> },
    ]} /></Panel>
  </>;
}
