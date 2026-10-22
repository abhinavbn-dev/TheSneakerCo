import { Link } from "react-router";
export default function Footer() {
  return (
    <footer className="sc-footer-0217">
      <div className="sc-footer-0218">
        <span>© 2026 The Sneaker Co.</span>
        <div className="sc-footer-0219">
          <Link to="/orders">Shipping & returns</Link>
          <Link to="/profile">Support</Link>
          <Link to="/catalog">Authenticity</Link>
          <Link to="/profile">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
