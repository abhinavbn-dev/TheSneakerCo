import { useState } from 'react';
import { Link } from 'react-router';
import PageHeader from '../components/PageHeader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import useProducts from '../hooks/useProducts.js';
import { useCart } from '../context/CartContext.jsx';

const DEFAULT_SIZES = ['6', '7', '8', '9', '10', '11'];

function getSizes(product) {
  const available =
    product.sizes ||
    product.availableSizes ||
    product.sizeOptions;

  if (Array.isArray(available) && available.length) {
    return available.map((size) =>
      String(typeof size === 'object' ? size.size : size)
    );
  }

  return DEFAULT_SIZES;
}

export default function Wishlist() {
  const { products } = useProducts();
  const { wishlist, addItem } = useCart();
  const [added, setAdded] = useState({});

  const saved = products.filter((product) =>
    wishlist.includes(String(product.id ?? product._id ?? ''))
  );

  const handleAdd = (product) => {
    const id = String(product.id ?? product._id ?? '');
    const size = getSizes(product)[0];

    if (!id || !size) return;

    addItem(id, size, 1, product);
    setAdded((previous) => ({ ...previous, [id]: true }));
  };

  return (
    <>
      <PageHeader title="Saved // Your grails" />

      {saved.length === 0 ? (
        <p className="sc-wishlist-0445">
          Nothing saved yet.{' '}
          <Link to="/catalog" className="sc-wishlist-0446">
            Browse the catalog
          </Link>{' '}
          and save the pairs you love.
        </p>
      ) : (
        <div className="sc-wishlist-0447">
          {saved.map((product) => {
            const id = String(product.id ?? product._id ?? '');

            return (
              <article key={id} className="min-w-0">
                <ProductCard product={product} />

                <div className="product-detail-actions mt-3">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleAdd(product)}
                  >
                    {added[id] ? 'Added to bag ✓' : 'Add to bag'}
                  </button>

                  {added[id] && (
                    <Link to="/cart" className="sc-wishlist-0446">
                      View bag
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}