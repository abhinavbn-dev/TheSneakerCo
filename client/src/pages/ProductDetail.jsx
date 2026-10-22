import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ProductCard from "../components/ProductCard.jsx";
import useProducts from "../hooks/useProducts.js";
import { useCart } from "../context/CartContext.jsx";
import { money } from "../utils.js";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products = [], loading, error } = useProducts();
  const { addItem } = useCart();

  const [size, setSize] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({
    x: 50,
    y: 50,
  });
  const [sizeError, setSizeError] = useState(false);

  const product = useMemo(
    () =>
      products.find(
        (item) => String(item.id ?? item._id) === String(id)
      ),
    [products, id]
  );

  const productId = product
    ? String(product.id ?? product._id)
    : String(id);

  const images = useMemo(() => {
    if (!product) return [];

    const productImages = [
      ...(Array.isArray(product.images) ? product.images : []),
      ...(product.image ? [product.image] : []),
    ];

    return [...new Set(productImages.filter(Boolean))];
  }, [product]);

  const sizes = useMemo(() => {
    if (!product) return [];

    if (Array.isArray(product.sizes) && product.sizes.length) {
      return product.sizes;
    }

    return [
      "UK 3",
      "UK 4",
      "UK 5",
      "UK 6",
      "UK 7",
      "UK 8",
      "UK 9",
      "UK 10",
      "UK 11",
      "UK 12",
    ];
  }, [product]);

  const colors = useMemo(() => {
    if (!product) return [];

    if (Array.isArray(product.colors) && product.colors.length) {
      return product.colors;
    }

    if (Array.isArray(product.colours) && product.colours.length) {
      return product.colours;
    }

    if (product.color) return [product.color];
    if (product.colour) return [product.colour];

    return [];
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];

    return products
      .filter((item) => {
        const itemId = String(item.id ?? item._id);

        return (
          itemId !== productId &&
          (!product.gender || item.gender === product.gender)
        );
      })
      .slice(0, 4);
  }, [products, product, productId]);

  useEffect(() => {
    setSize(null);
    setActiveImage(0);
    setSelectedColor(null);
    setZoomOpen(false);
    setIsHovering(false);
    setSizeError(false);
    setZoomPosition({ x: 50, y: 50 });
  }, [id]);

  useEffect(() => {
    if (!zoomOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setZoomOpen(false);
      }

      if (event.key === "ArrowRight") {
        setActiveImage((current) =>
          images.length ? (current + 1) % images.length : 0
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveImage((current) =>
          images.length
            ? (current - 1 + images.length) % images.length
            : 0
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [zoomOpen, images.length]);

  function handleSizeClick(selectedSize) {
    setSize((currentSize) =>
      currentSize !== null &&
      String(currentSize) === String(selectedSize)
        ? null
        : selectedSize
    );

    setSizeError(false);
  }

  function handleAddToBag() {
    if (!size) {
      setSizeError(true);
      return;
    }

    addItem(productId, size, 1, product);
    navigate("/cart");
  }

  function handleBuyNow() {
    if (!size) {
      setSizeError(true);
      return;
    }

    addItem(productId, size, 1, product);
    navigate("/checkout");
  }

  function handleImageMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }

  function showPreviousImage(event) {
    event?.stopPropagation();

    setActiveImage((current) =>
      images.length
        ? (current - 1 + images.length) % images.length
        : 0
    );
  }

  function showNextImage(event) {
    event?.stopPropagation();

    setActiveImage((current) =>
      images.length ? (current + 1) % images.length : 0
    );
  }

  if (loading) {
    return (
      <main className="product-detail-page">
        <p>Loading product...</p>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="product-detail-page">
        <p>Unable to load this product.</p>
        <Link to="/catalog">Back to products</Link>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-detail-page product-not-found">
        <h2>Product not found</h2>
        <p>This product may no longer be available.</p>
        <Link to="/catalog">Continue shopping</Link>
      </main>
    );
  }

  const currentImage = images[activeImage];

  return (
    <main className="product-detail-page">
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/catalog">Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <section className="product-detail-layout">
        <div className="product-gallery">
          <div className="product-gallery-thumbnails">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`product-thumbnail ${
                  activeImage === index ? "is-active" : ""
                }`}
                onClick={() => setActiveImage(index)}
                aria-label={`View product image ${index + 1}`}
                aria-pressed={activeImage === index}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>

          <div
            className={`product-gallery-stage ${
              isHovering ? "is-zooming" : ""
            }`}
          >
            <div
              className="product-gallery-main"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onMouseMove={handleImageMouseMove}
              onClick={() => setZoomOpen(true)}
            >
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  style={{
                    objectPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }}
                />
              ) : (
                <div className="product-card-no-image">
                  {product.brand || "The Sneaker Co."}
                </div>
              )}

              {images.length > 1 && (
                <span className="product-gallery-count">
                  {activeImage + 1} / {images.length}
                </span>
              )}
            </div>

            {isHovering && currentImage && (
              <div
                className="product-gallery-zoom-panel"
                style={{
                  backgroundImage: `url("${currentImage}")`,
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        <div className="product-detail-info">
          <p className="product-detail-brand">
            {product.brand || "The Sneaker Co."}
          </p>

          <h1 className="product-detail-title">{product.name}</h1>

          <p className="product-detail-price">
            {money(product.price)}
          </p>

          {product.description && (
            <p className="product-detail-description">
              {product.description}
            </p>
          )}

          {colors.length > 0 && (
            <div className="product-option-group">
              <p className="product-option-label">
                Colour
                {selectedColor && (
                  <span className="product-option-value">
                    {" "}
                    —{" "}
                    {typeof selectedColor === "object"
                      ? selectedColor.name
                      : selectedColor}
                  </span>
                )}
              </p>

              <div className="product-color-options">
                {colors.map((color, index) => {
                  const colorName =
                    typeof color === "object" ? color.name : color;

                  const colorValue =
                    typeof color === "object"
                      ? color.hex || color.value || color.name
                      : color;

                  const isSelected =
                    String(
                      typeof selectedColor === "object"
                        ? selectedColor?.name
                        : selectedColor
                    ) === String(colorName);

                  return (
                    <button
                      key={`${colorName}-${index}`}
                      type="button"
                      className={`product-color-button ${
                        isSelected ? "is-selected" : ""
                      }`}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Select colour ${colorName}`}
                      aria-pressed={isSelected}
                      title={colorName}
                    >
                      <span
                        className="product-color-swatch"
                        style={{ backgroundColor: colorValue }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="product-option-group">
            <p className="product-option-label">
              Select size (UK)
            </p>

            <div className="product-size-options">
              {sizes.map((itemSize, index) => {
                const itemSizeValue =
                  typeof itemSize === "object"
                    ? itemSize.label ?? itemSize.size
                    : itemSize;

                const selected =
                  String(size) === String(itemSizeValue);

                return (
                  <button
                    key={`${itemSizeValue}-${index}`}
                    type="button"
                    className={`product-size-button ${
                      selected ? "is-selected" : ""
                    }`}
                    onClick={() => handleSizeClick(itemSizeValue)}
                    aria-pressed={selected}
                  >
                    {itemSizeValue}
                  </button>
                );
              })}
            </div>

            {sizeError && (
              <p className="product-size-error" role="alert">
                Please select a size before continuing.
              </p>
            )}
          </div>

          <div className="product-detail-actions">
            <button
              type="button"
              className="product-add-to-bag"
              onClick={handleAddToBag}
            >
              Add to Bag
            </button>

            <button
              type="button"
              className="product-buy-now"
              onClick={handleBuyNow}
            >
              Buy Now
            </button>
          </div>

          <div className="product-detail-policies">
            <div className="product-policy-item">
              <strong>Authenticity guaranteed</strong>
              <span>Every pair is verified.</span>
            </div>

            <div className="product-policy-item">
              <strong>Secure delivery</strong>
              <span>Reliable delivery to your door.</span>
            </div>

            <div className="product-policy-item">
              <strong>Need help?</strong>
              <span>Contact us for assistance with your order.</span>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="product-related-section">
          <h2>You may also like</h2>

          <div className="product-related-grid">
            {relatedProducts.map((item) => (
              <ProductCard
                key={String(item.id ?? item._id)}
                product={item}
              />
            ))}
          </div>
        </section>
      )}

      {zoomOpen && currentImage && (
        <div
          className="product-zoom-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            className="product-zoom-close"
            aria-label="Close image viewer"
            onClick={() => setZoomOpen(false)}
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="product-zoom-nav product-zoom-prev"
                aria-label="Previous image"
                onClick={showPreviousImage}
              >
                ‹
              </button>

              <button
                type="button"
                className="product-zoom-nav product-zoom-next"
                aria-label="Next image"
                onClick={showNextImage}
              >
                ›
              </button>
            </>
          )}

          <img
            src={currentImage}
            alt={product.name}
            onClick={(event) => event.stopPropagation()}
          />

          {images.length > 1 && (
            <span className="product-gallery-count">
              {activeImage + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </main>
  );
}