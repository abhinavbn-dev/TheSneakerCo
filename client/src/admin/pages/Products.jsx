import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, DataTable, PageHeader, Pager, Panel, SearchBar, Stat, Tabs, usePaged } from '../components/ui';
import { inr } from '../data/adminData';
import { api } from '../../services/api.js';
import './Products.css';

const FILTERS = ['All', 'Active', 'Low stock', 'Out of stock'];
const EMPTY_FORM = { name: '', brand: '', sku: '', price: '', stock: '0', description: '', sizes: '7, 8, 9, 10', colors: 'Black, White', gender: 'men', tag: '', published: true };
const statusOf = (product) => Number(product.stock) === 0 ? 'Out of stock' : Number(product.stock) <= 10 ? 'Low stock' : 'Active';

export default function Products() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ totalSkus: 0, units: 0, lowStock: 0, inventoryValue: 0 });
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [selectedPreviews, setSelectedPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminProducts({ limit: 100 });
      setRows((data.items || data.products || []).map((product) => ({ ...product, id: String(product.id || product._id) })));
      setSummary(data.summary || { totalSkus: data.total || 0, units: 0, lowStock: 0, inventoryValue: 0 });
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load products. Sign in with an admin account.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    const previews = files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setSelectedPreviews(previews);
    return () => previews.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [files]);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setFiles([]); setFormOpen(true); setError(''); };
  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '', brand: product.brand || '', sku: product.sku || '', price: String(product.price ?? ''),
      stock: String(product.stock ?? 0), description: product.description || '', sizes: (product.sizes || []).join(', '),
      colors: (product.colors || []).join(', '), gender: product.gender || 'men', tag: product.tag || '', published: product.published !== false,
    });
    setFiles([]); setFormOpen(true); setError('');
  };

  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        name: form.name.trim(), brand: form.brand.trim(), sku: form.sku.trim() || undefined,
        price: Number(form.price), stock: Number(form.stock),
        sizes: form.sizes.split(',').map((value) => value.trim()).filter(Boolean),
        colors: form.colors.split(',').map((value) => value.trim()).filter(Boolean),
      };
      let saved;
      if (editing) {
        const result = await api.updateProduct(editing.id, payload);
        saved = result.product || result;
      } else {
        const result = await api.createProduct(payload);
        saved = result.product || result;
      }
      const id = saved.id || saved._id;
      const selectedFiles = Array.from(files || []);
      if (selectedFiles.length && id) {
        await api.uploadProductImages(id, selectedFiles, { replace: Boolean(editing) });
      }
      setFormOpen(false); setEditing(null); setForm(EMPTY_FORM); setFiles([]);
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Could not save this product.');
    } finally { setSaving(false); }
  };

  const remove = async (product) => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    try { await api.deleteProduct(product.id); await loadProducts(); }
    catch (err) { setError(err.message || 'Could not delete product.'); }
  };

  const filtered = useMemo(() => rows.filter((product) => {
    const matchesFilter = filter === 'All' || statusOf(product).toLowerCase() === filter.toLowerCase();
    const haystack = `${product.name || ''} ${product.brand || ''} ${product.sku || ''}`.toLowerCase();
    return matchesFilter && haystack.includes(q.toLowerCase());
  }), [rows, filter, q]);
  const paged = usePaged(filtered);

  return (
    <>
      <PageHeader title="Products & inventory" subtitle="Manage sneaker catalogue, pricing, images and live stock levels" actions={<Button variant="primary" onClick={openNew}>Add product</Button>} />
      {error && <div role="alert" className="products-alert">{error}</div>}

      <div className="products-stat-grid">
        <Stat label="Total SKUs" value={summary.totalSkus.toLocaleString('en-IN')} />
        <Stat label="Units in stock" value={summary.units.toLocaleString('en-IN')} />
        <Stat label="Low stock" value={summary.lowStock.toLocaleString('en-IN')} accent />
        <Stat label="Inventory value" value={inr(summary.inventoryValue)} />
      </div>

      {formOpen && (
        <Panel title={editing ? `Edit product — ${editing.sku || editing.name}` : 'Add sneaker'} className="products-form-panel">
          <form onSubmit={submit} className="products-form-grid">
            <label className="products-field">Product name *<input required maxLength={120} value={form.name} onChange={(e) => update('name', e.target.value)} className="products-control" /></label>
            <label className="products-field">Brand *<input required value={form.brand} onChange={(e) => update('brand', e.target.value)} className="products-control" /></label>
            <label className="products-field">SKU (optional)<input value={form.sku} onChange={(e) => update('sku', e.target.value)} placeholder="Generated if left blank" className="products-control" /></label>
            <label className="products-field">Brand audience *<select value={form.gender} onChange={(e) => update('gender', e.target.value)} className="products-control"><option value="men">Men</option><option value="women">Women</option></select></label>
            <label className="products-field">Price (₹) *<input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} className="products-control" /></label>
            <label className="products-field">Stock *<input required type="number" min="0" step="1" value={form.stock} onChange={(e) => update('stock', e.target.value)} className="products-control" /></label>
            <label className="products-field">Sizes (comma-separated)<input value={form.sizes} onChange={(e) => update('sizes', e.target.value)} placeholder="7, 8, 9, 10" className="products-control" /></label>
            <label className="products-field">Colours (comma-separated)<input value={form.colors} onChange={(e) => update('colors', e.target.value)} placeholder="Black, White" className="products-control" /></label>
            <label className="products-field">Tag<input value={form.tag} onChange={(e) => update('tag', e.target.value)} placeholder="New, Drop, Classic…" className="products-control" /></label>

            <div className="products-field-full">
              <label htmlFor="product-image-upload" className="products-field-label">Product images</label>
              <div className="products-upload-box">
                <div className="products-upload-header">
                  <div>
                    <p className="products-upload-heading">Upload sneaker photos</p>
                    <p className="products-upload-copy">JPG, PNG, WebP, GIF or AVIF · Up to 5 images · 5 MB each. Select several at once, or choose images again to add more.</p>
                  </div>
                  <label htmlFor="product-image-upload" className="products-file-label">Choose images</label>
                  <input
                    id="product-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    multiple
                    onChange={(e) => {
                      const picked = Array.from(e.target.files || []);
                      setFiles((current) => {
                        const combined = [...current, ...picked];
                        const seen = new Set();
                        return combined.filter((file) => {
                          const key = `${file.name}:${file.size}:${file.lastModified}`;
                          if (seen.has(key)) return false;
                          seen.add(key);
                          return true;
                        }).slice(0, 5);
                      });
                      e.target.value = '';
                    }}
                    className="products-file-input"
                  />
                </div>

                {selectedPreviews.length > 0 && (
                  <div className="products-preview-section">
                    <p className="products-section-kicker">Selected for upload ({selectedPreviews.length})</p>
                    <div className="products-selected-grid">
                      {selectedPreviews.map((preview, index) => (
                        <div key={`${preview.name}-${index}`} className="products-preview-card">
                          <img src={preview.url} alt={`Preview of ${preview.name}`} className="products-preview-image" />
                          <p className="products-preview-name" title={preview.name}>{preview.name}</p>
                          <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="products-remove-file">Remove</button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => { setFiles([]); const input = document.getElementById('product-image-upload'); if (input) input.value = ''; }} className="products-clear-selection">Clear selection</button>
                  </div>
                )}

                {editing?.images?.length > 0 && (
                  <div className="products-current-section">
                    <p className="products-section-kicker">Current product images</p>
                    <div className="products-current-grid">
                      {editing.images.map((image, index) => (
                        <div key={`${image}-${index}`} className="products-current-card">
                          <img src={image} alt={`Current product image ${index + 1}`} />
                          <p>Image {index + 1}</p>
                        </div>
                      ))}
                    </div>
                    {files.length > 0 && <p className="products-replace-note">Saving these new images will replace the current image set.</p>}
                  </div>
                )}

                {!selectedPreviews.length && !editing?.images?.length && <p className="products-no-selection">No images selected. You can add photos now or edit the product later.</p>}
              </div>
            </div>

            <label className="products-field products-field-full">Description<textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} className="products-control" /></label>
            <label className="products-published"><input type="checkbox" checked={form.published} onChange={(e) => update('published', e.target.checked)} /> Published on storefront</label>
            <div className="products-form-actions">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</Button>
              <Button type="button" onClick={() => { setFormOpen(false); setEditing(null); setFiles([]); }}>Cancel</Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="products-table-panel">
        <div className="products-table-toolbar">
          <SearchBar value={q} onChange={setQ} placeholder="Search product, brand or SKU" />
          <Tabs tabs={FILTERS} value={filter} onChange={setFilter} />
        </div>
        {loading ? <p className="products-loading">Loading products…</p> : (
          <DataTable rowKey="id" rows={paged.slice} columns={[
            { label: 'Image', render: (product) => product.images?.[0] ? <img src={product.images[0]} alt={`${product.name} sneaker`} className="products-table-image" loading="lazy" /> : <div className="products-no-image">NO IMAGE</div> },
            { label: 'Product', render: (product) => <div className="products-name-cell"><p className="products-name">{product.name}</p><p className="products-sku">{product.sku || 'No SKU'}</p></div> },
            { label: 'Brand', key: 'brand' },
            { label: 'Audience', render: (product) => <span className="products-capitalize">{product.gender || 'men'}</span> },
            { label: 'Price', align: 'right', render: (product) => inr(product.price) },
            { label: 'Stock', align: 'right', key: 'stock' },
            { label: 'Status', render: (product) => <Badge>{statusOf(product)}</Badge> },
            { label: 'Actions', align: 'right', render: (product) => <div className="products-table-actions"><Button onClick={() => openEdit(product)}>Edit</Button><Button variant="danger" onClick={() => remove(product)}>Delete</Button></div> },
          ]} />
        )}
        {!loading && <Pager {...paged} />}
      </Panel>
    </>
  );
}
