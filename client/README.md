# The Sneaker Co. client (React + Vite)

    npm install
    npm run dev

- Backend calls: `src/services/api.js` (proxy `/api` and `/uploads` -> `http://localhost:5001`).
- Pages fall back to `src/data/products.js` when the API is unavailable.
- Set `VITE_REQUIRE_AUTH=true` in `.env` once backend auth works.


Frontend styling uses regular CSS in `src/index.css`, `src/component-styles.css`, and component-specific CSS files.
