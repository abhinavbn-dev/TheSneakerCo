
import { Link } from "react-router";
import ProductCard from "../components/ProductCard.jsx";
import useProducts from "../hooks/useProducts.js";
import "./Home.css";

import menImage from "../assets/images/men.jpg.avif";
import womenImage from "../assets/images/women.jpg.avif";
import heroSneakerImage from "../assets/images/made-to-move-sneaker.jpg";

const genderCategories = [
  {
    name: "MEN",
    gender: "men",
    image: menImage,
    description: "Find your next favourite.",
  },
  {
    name: "WOMEN",
    gender: "women",
    image: womenImage,
    description: "Made to move with you.",
  },
];

export default function Home() {
  const { products } = useProducts();

  const featuredProducts = (products || []).slice(0, 4);

  return (
    <div className="sc-home">
      {/* HERO */}
      <section className="sc-home-hero">
        <div className="sc-home-hero-art">
          <img src={heroSneakerImage} alt="" fetchPriority="high" />

          <div className="sc-home-hero-copy">
            <h1>
              Made to move.
            </h1>
            <p className="sc-home-hero-description">
              Find your next everyday pair.
            </p>
            <div className="sc-home-hero-actions">
              <Link to="/catalog" className="sc-home-button">
                Shop collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP BY GENDER */}
      <section className="sc-home-gender">
        <div className="sc-home-section-heading">
          <div>
            <p className="sc-home-eyebrow">FIND YOUR FIT</p>
            <h2>Shop by category</h2>
          </div>

          <Link to="/catalog" className="sc-home-text-link">
            View all
          </Link>
        </div>

        <div className="sc-home-gender-grid">
          {genderCategories.map((category) => (
            <Link
              key={category.gender}
              to={`/catalog?gender=${category.gender}`}
              className="sc-home-gender-card"
              aria-label={`Shop ${category.name.toLowerCase()}`}
            >
              <img
                src={category.image}
                alt={`${category.name} footwear`}
                className="sc-home-gender-image"
                loading="lazy"
              />

              <div className="sc-home-gender-shade" />

              <div className="sc-home-gender-content">
                <div>
                  <p>{category.description}</p>
                  <h3>{category.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="sc-home-featured">
        <div className="sc-home-section-heading">
          <div>
            <p className="sc-home-eyebrow">THE ROTATION</p>
            <h2>Featured footwear</h2>
          </div>

          <Link to="/catalog" className="sc-home-text-link">
            Shop all
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="sc-home-product-grid">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id ?? product._id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="sc-home-empty">
            <p>New favourites are on their way.</p>
            <Link to="/catalog" className="sc-home-button">
              Explore the catalog
            </Link>
          </div>
        )}
      </section>

      {/* BRAND STATEMENT */}
      <section className="sc-home-statement">
        <p className="sc-home-eyebrow">LESS NOISE. MORE MOVEMENT.</p>

        <h2>
          Your style.
          <br />
          Your pace.
          <br />
          <span>Your everyday.</span>
        </h2>

        <Link to="/catalog" className="sc-home-button sc-home-button-light">
          Find your pair
        </Link>
      </section>
    </div>
  );
}
