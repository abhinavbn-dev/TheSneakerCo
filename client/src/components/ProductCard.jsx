
import { Link } from "react-router";
import { money } from "../utils.js";
import { useCart } from "../context/CartContext.jsx";
import "./ProductCard.css";

export function ProductImage({
  product,
  className = "product-card-image",
  imageIndex = 0,
}) {
  const image = product?.images?.[imageIndex];

  return (
    <div className={`${className} product-card-image-frame`}>
      {image ? (
        <img
          src={image}
          alt={product.name || "Sneaker"}
          loading="lazy"
        />
      ) : (
        <div className="product-card-no-image">
          {product?.brand || "The Sneaker Co."}
        </div>
      )}
    </div>
  );
}

function HeartButton({ saved, onClick, productName }) {
  return (
    <button
      type="button"
      className={`product-card-save ${saved ? "is-saved" : ""}`}
      onClick={onClick}
      aria-label={
        saved
          ? `Remove ${productName} from wishlist`
          : `Add ${productName} to wishlist`
      }
      aria-pressed={saved}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
          fill={saved ? "#e11d48" : "none"}
          stroke={saved ? "#e11d48" : "#262626"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function ProductCard({ product }) {
  const { wishlist, toggleWish } = useCart();

  const id = String(product.id ?? product._id);
  const saved = wishlist.some((item) => String(item) === id);

  return (
    <article className="product-card">
      <div className="product-card-media">
        <Link
          to={`/product/${id}`}
          aria-label={`View ${product.name}`}
          className="product-card-image-link"
        >
          <ProductImage product={product} />
        </Link>

        {product.tag && (
          <span className="product-card-tag">{product.tag}</span>
        )}

        <HeartButton
          saved={saved}
          onClick={() => toggleWish(id)}
          productName={product.name}
        />
      </div>

      <div className="product-card-details">
        <p className="product-card-brand">{product.brand}</p>

        <Link
          to={`/product/${id}`}
          className="product-card-name"
        >
          {product.name}
        </Link>

        <p className="product-card-price">{money(product.price)}</p>
      </div>
    </article>
  );
}
