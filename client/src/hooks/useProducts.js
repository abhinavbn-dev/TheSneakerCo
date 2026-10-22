import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { products as fallback } from '../data/products.js';

function normalizeProduct(product) {
  const rawGender = String(product.gender || 'men').toLowerCase();
  return {
    ...product,
    id: String(product.id || product._id || product.sku || ''),
    _id: product._id || product.id,
    gender: ['men', 'women'].includes(rawGender) ? rawGender : 'men',
    tag: product.tag || '',
    sizes: Array.isArray(product.sizes) ? product.sizes.map(String) : [],
    colors: Array.isArray(product.colors) ? product.colors : [],
    images: Array.isArray(product.images) ? product.images : [],
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
  };
}

export default function useProducts(query = '') {
  const [products, setProducts] = useState(fallback.map(normalizeProduct));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.getProducts(query)
      .then((data) => {
        if (!alive) return;
        const rows = Array.isArray(data) ? data : data.items || data.products || [];
        setProducts(rows.map(normalizeProduct));
        setError('');
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Could not load products. Showing sample catalogue.');
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [query]);

  return { products, loading, error };
}
