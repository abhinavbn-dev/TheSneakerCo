
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import Logo from "./Logo.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./Navbar.css";

const categoryLinks = [
  { label: "New & Featured", to: "/catalog" },
  { label: "Men", to: "/catalog?gender=men" },
  { label: "Women", to: "/catalog?gender=women" },
];

function MenuIcon({ name }) {
  const paths = {
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 4" /><path d="M12 17.5h.01" /></>,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    orders: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    wallet: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 9h18M7 4h10M16 14h.01" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function imageUrl(value) {
  if (!value) return "";

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  return `/${value.replace(/^\/+/, "")}`;
}

export default function Navbar() {
  const { count, wishlist } = useCart();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const profilePicture = imageUrl(user?.profilePicture);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  function signOut() {
    logout();
    setMenuOpen(false);
    navigate("/signin");
  }

  return (
    <header className="store-navbar">
      <div className="store-navbar-inner">
        <Logo />

        <nav
          className="store-navbar-links"
          aria-label="Main navigation"
        >
          <Link to="/wishlist" className="store-navbar-link">
            Wishlist <span>({wishlist.length})</span>
          </Link>

          <Link to="/cart" className="store-navbar-link">
            Bag <span>({count})</span>
          </Link>

          <Link to="/orders" className="store-navbar-link">
            Orders
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            className="store-navbar-menu-button"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="store-navigation-drawer"
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </div>

      {menuOpen && (
        <div className="store-menu-layer">
          <button
            type="button"
            className="store-menu-backdrop"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            id="store-navigation-drawer"
            className="store-menu-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="store-menu-top">
              <button
                ref={closeButtonRef}
                type="button"
                className="store-menu-close"
                aria-label="Close navigation menu"
                onClick={() => setMenuOpen(false)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="store-menu-content">
              <Link
                to={user ? "/profile" : "/signin"}
                className="store-menu-greeting"
                onClick={() => setMenuOpen(false)}
              >
                {user && profilePicture ? (
                  <img src={profilePicture} alt="" />
                ) : (
                  <span className="store-menu-avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
                <span>
                  <strong>{user ? `Hi, ${user.name || "there"}` : "Welcome"}</strong>
                  {user?.phone && <small>{user.phone}</small>}
                  {!user && <small>Sign in or join The Sneaker Co.</small>}
                </span>
              </Link>

              <nav className="store-menu-categories" aria-label="Shop categories">
                {categoryLinks.map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{label}</span>
                    <span className="store-menu-chevron" aria-hidden="true">›</span>
                  </Link>
                ))}
              </nav>

              <nav className="store-menu-shortcuts" aria-label="Account and shopping">
                <Link to="/profile" onClick={() => setMenuOpen(false)}>
                  <MenuIcon name="help" />
                  <span>Help</span>
                </Link>
                <Link to="/cart" onClick={() => setMenuOpen(false)}>
                  <MenuIcon name="bag" />
                  <span>Bag</span>
                  <small>{count}</small>
                </Link>
                <Link to="/wishlist" onClick={() => setMenuOpen(false)}>
                  <MenuIcon name="heart" />
                  <span>Favourites</span>
                  <small>{wishlist.length}</small>
                </Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)}>
                  <MenuIcon name="orders" />
                  <span>Orders</span>
                </Link>
                <Link to="/profile/wallet" onClick={() => setMenuOpen(false)}>
                  <MenuIcon name="wallet" />
                  <span>Wallet &amp; credits</span>
                </Link>
                {user ? (
                  <button type="button" onClick={signOut}>
                    <MenuIcon name="logout" />
                    <span>Log out</span>
                  </button>
                ) : (
                  <Link to="/signin" onClick={() => setMenuOpen(false)}>
                    <MenuIcon name="logout" />
                    <span>Sign in</span>
                  </Link>
                )}
              </nav>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
