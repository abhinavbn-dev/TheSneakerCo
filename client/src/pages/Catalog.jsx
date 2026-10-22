import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import ProductCard from "../components/ProductCard.jsx";
import useProducts from "../hooks/useProducts.js";
import "./Catalog.css";

export default function Catalog() {
  const { products, loading, error } = useProducts();
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [openPanel, setOpenPanel] = useState(null);

  const gender = params.get("gender") || "all";
  const brand = params.get("brand") || "all";

  const brands = useMemo(
    () =>
      [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
    [products]
  );

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    next.delete("tag");

    if (value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    setParams(next);
  }

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    let list = products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.name,
          product.brand,
          product.category,
          product.description,
          product.sku,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );

      const productGender = String(product.gender || "").toLowerCase();
      const matchesGender =
        gender === "all" || productGender === gender;

      const matchesBrand =
        brand === "all" || product.brand === brand;

      const price = Number(product.price) || 0;
      const matchesMin =
        minPrice === "" || price >= Number(minPrice);
      const matchesMax =
        maxPrice === "" || price <= Number(maxPrice);

      return (
        matchesSearch &&
        matchesGender &&
        matchesBrand &&
        matchesMin &&
        matchesMax
      );
    });

    if (sort === "low") {
      list = [...list].sort(
        (a, b) => Number(a.price) - Number(b.price)
      );
    }

    if (sort === "high") {
      list = [...list].sort(
        (a, b) => Number(b.price) - Number(a.price)
      );
    }

    return list;
  }, [
    products,
    search,
    gender,
    brand,
    minPrice,
    maxPrice,
    sort,
  ]);

  const activeFilterCount = [
    gender !== "all",
    brand !== "all",
    minPrice !== "",
    maxPrice !== "",
  ].filter(Boolean).length;

  const hasActiveFilters =
    search.trim() !== "" || activeFilterCount > 0;

  function clearFilters() {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSort("featured");
    setParams({});
    setOpenPanel(null);
  }

  function togglePanel(panel) {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <div className="catalog-heading">
          <p className="catalog-eyebrow">
            THE SNEAKER CO. / COLLECTION
          </p>
          <h1 className="catalog-title">Discover your next pair.</h1>
          <p className="catalog-subtitle">
            Considered design. Everyday essentials.
          </p>
        </div>
      </header>

      <div className="catalog-search">
        <span className="catalog-search-icon" aria-hidden="true">
          ⌕
        </span>

        <input
          id="catalog-search-input"
          type="search"
          aria-label="Search sneakers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sneakers, brands and styles"
        />

        {search && (
          <button
            type="button"
            className="catalog-search-clear"
            onClick={() => setSearch("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <section className="catalog-toolbar" aria-label="Catalog controls">
        <div className="catalog-toolbar-left">
          <button
            type="button"
            className={`catalog-toolbar-button ${
              openPanel === "filter" ? "is-open" : ""
            }`}
            aria-expanded={openPanel === "filter"}
            aria-controls="catalog-filter-panel"
            onClick={() => togglePanel("filter")}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M4 7h16M7 12h10m-7 5h4" />
              <circle cx="8" cy="7" r="1.5" fill="currentColor" />
              <circle cx="15" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="17" r="1.5" fill="currentColor" />
            </svg>

            <span>Filter</span>

            {activeFilterCount > 0 && (
              <span className="catalog-filter-count">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`catalog-toolbar-button ${
              openPanel === "sort" ? "is-open" : ""
            }`}
            aria-expanded={openPanel === "sort"}
            aria-controls="catalog-sort-panel"
            onClick={() => togglePanel("sort")}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M8 5v14m0 0-4-4m4 4 4-4M16 19V5m0 0-4 4m4-4 4 4" />
            </svg>

            <span>Sort</span>
          </button>
        </div>

        <div className="catalog-toolbar-right">
          <span className="catalog-results-count">
            {loading
              ? "Loading sneakers..."
              : `${filteredProducts.length} ${
                  filteredProducts.length === 1 ? "pair" : "pairs"
                }`}
          </span>
        </div>
      </section>

      {openPanel === "filter" && (
        <section
          className="catalog-control-panel"
          id="catalog-filter-panel"
          aria-label="Filter products"
        >
          <div className="catalog-panel-heading">
            <div>
              <h2>Refine your selection</h2>
              <p>Find the pair that feels right.</p>
            </div>

            <button
              type="button"
              className="catalog-panel-close"
              onClick={() => setOpenPanel(null)}
              aria-label="Close filters"
            >
              ×
            </button>
          </div>

          <div className="catalog-filter-grid">
            <section className="catalog-filter">
              <h3>Gender</h3>

              <div className="catalog-filter-options">
                {["all", "men", "women"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`catalog-filter-option ${
                      gender === option ? "is-active" : ""
                    }`}
                    aria-pressed={gender === option}
                    onClick={() => setParam("gender", option)}
                  >
                    {option === "all"
                      ? "All"
                      : option.charAt(0).toUpperCase() +
                        option.slice(1)}
                  </button>
                ))}
              </div>
            </section>

            <section className="catalog-filter">
              <h3>Brand</h3>

              <div className="catalog-brand-options">
                <button
                  type="button"
                  className={`catalog-filter-option ${
                    brand === "all" ? "is-active" : ""
                  }`}
                  aria-pressed={brand === "all"}
                  onClick={() => setParam("brand", "all")}
                >
                  All brands
                </button>

                {brands.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`catalog-filter-option ${
                      brand === option ? "is-active" : ""
                    }`}
                    aria-pressed={brand === option}
                    onClick={() => setParam("brand", option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </section>

            <section className="catalog-filter catalog-price-filter">
              <h3>Price range</h3>
              <p className="catalog-filter-hint">Prices in INR (₹)</p>

              <div className="catalog-price-fields">
                <div>
                  <label htmlFor="catalog-min-price">Min</label>
                  <input
                    id="catalog-min-price"
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="₹ 0"
                  />
                </div>

                <div>
                  <label htmlFor="catalog-max-price">Max</label>
                  <input
                    id="catalog-max-price"
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="No limit"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="catalog-panel-footer">
            <button
              type="button"
              className="catalog-reset-button"
              onClick={clearFilters}
            >
              Clear all
            </button>

            <button
              type="button"
              className="catalog-apply-button"
              onClick={() => setOpenPanel(null)}
            >
              Show {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "pair" : "pairs"}
            </button>
          </div>
        </section>
      )}

      {openPanel === "sort" && (
        <section
          className="catalog-control-panel catalog-sort-panel"
          id="catalog-sort-panel"
          aria-label="Sort products"
        >
          <div className="catalog-panel-heading">
            <div>
              <h2>Sort by</h2>
              <p>Choose how your collection is arranged.</p>
            </div>

            <button
              type="button"
              className="catalog-panel-close"
              onClick={() => setOpenPanel(null)}
              aria-label="Close sorting options"
            >
              ×
            </button>
          </div>

          <div className="catalog-sort-options">
            {[
              ["featured", "Featured", "Our collection, as curated."],
              ["low", "Price: low to high", "Start with the lowest price."],
              ["high", "Price: high to low", "Start with the highest price."],
            ].map(([value, label, description]) => (
              <button
                key={value}
                type="button"
                className={`catalog-sort-option ${
                  sort === value ? "is-active" : ""
                }`}
                aria-pressed={sort === value}
                onClick={() => {
                  setSort(value);
                  setOpenPanel(null);
                }}
              >
                <span className="catalog-sort-option-copy">
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>

                <span className="catalog-sort-radio" aria-hidden="true">
                  {sort === value ? "●" : "○"}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {hasActiveFilters && (
        <div className="catalog-active-filters">
          <span className="catalog-active-label">Applied</span>

          {gender !== "all" && (
            <button
              type="button"
              className="catalog-active-chip"
              onClick={() => setParam("gender", "all")}
            >
              {gender} <span>×</span>
            </button>
          )}

          {brand !== "all" && (
            <button
              type="button"
              className="catalog-active-chip"
              onClick={() => setParam("brand", "all")}
            >
              {brand} <span>×</span>
            </button>
          )}

          {minPrice !== "" && (
            <button
              type="button"
              className="catalog-active-chip"
              onClick={() => setMinPrice("")}
            >
              Min ₹{minPrice} <span>×</span>
            </button>
          )}

          {maxPrice !== "" && (
            <button
              type="button"
              className="catalog-active-chip"
              onClick={() => setMaxPrice("")}
            >
              Max ₹{maxPrice} <span>×</span>
            </button>
          )}

          {search.trim() !== "" && (
            <button
              type="button"
              className="catalog-active-chip"
              onClick={() => setSearch("")}
            >
              Search: {search.trim()} <span>×</span>
            </button>
          )}

          <button
            type="button"
            className="catalog-clear-inline"
            onClick={clearFilters}
          >
            Clear all
          </button>
        </div>
      )}

      <section className="catalog-results" aria-live="polite">
        {error && <p className="catalog-error">{error}</p>}

        {loading && (
          <p className="catalog-empty">Loading collection...</p>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="catalog-empty">
            <h2>No pairs found</h2>
            <p>
              Try another search or adjust your filters to explore
              the collection.
            </p>

            <button
              type="button"
              className="catalog-apply-button"
              onClick={clearFilters}
            >
              Clear search and filters
            </button>
          </div>
        )}

        {!loading && filteredProducts.length > 0 && (
          <div className="catalog-products">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id ?? product._id}
                product={product}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}