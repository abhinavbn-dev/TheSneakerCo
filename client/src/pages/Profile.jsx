
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import AccountNav from "../components/AccountNav.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { money } from "../utils.js";
import "./Profile.css";

function getProfilePictureUrl(value) {
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) return value;

  const apiBase = import.meta.env.VITE_API_URL || "/api";
  const apiOrigin = /^https?:\/\//i.test(apiBase)
    ? apiBase.replace(/\/api\/?$/, "")
    : "";

  return `${apiOrigin}${value.startsWith("/") ? value : `/${value}`}`;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status) {
  return String(status || "Processing")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const pictureInput = useRef(null);

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [picturePreview, setPicturePreview] = useState("");
  const [pictureMessage, setPictureMessage] = useState("");
  const [pictureUploading, setPictureUploading] = useState(false);

  const name = user?.name || "Member";
  const email = user?.email || "";
  const savedPicture = getProfilePictureUrl(user?.profilePicture);
  const displayedPicture = picturePreview || savedPicture;

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const result = await api.getOrders();
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result?.orders)
            ? result.orders
            : [];

        if (active) setOrders(list.slice(0, 5));
      } catch (err) {
        if (active) {
          setError(err.message || "We couldn't load your recent orders.");
        }
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (picturePreview.startsWith("blob:")) {
        URL.revokeObjectURL(picturePreview);
      }
    };
  }, [picturePreview]);

  async function changeProfilePicture(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPictureMessage("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPictureMessage("Your image must be 5 MB or smaller.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setPicturePreview(preview);
    setPictureMessage("");
    setPictureUploading(true);

    try {
      const result = await api.uploadProfilePicture(file);

      if (result?.user) {
        setUser(result.user);
      } else if (result?.profilePicture) {
        setUser((current) => ({
          ...current,
          profilePicture: result.profilePicture,
        }));
      }

      setPictureMessage("Profile photo updated.");
    } catch (err) {
      setPictureMessage(
        err.message || "We couldn't update your profile photo."
      );
    } finally {
      setPicturePreview("");
      URL.revokeObjectURL(preview);
      setPictureUploading(false);
    }
  }

  function handleSignOut() {
    logout();
    navigate("/signin", { replace: true });
  }

  return (
    <main className="sc-profile-page">
      <div className="sc-profile-layout">
        <aside className="sc-profile-sidebar">
          <AccountNav />
        </aside>

        <div className="sc-profile-main">
          <header className="sc-profile-heading">
            <h1>Personal details</h1>
            <p className="sc-profile-intro">
              Manage your profile information and recent orders.
            </p>
          </header>

          <section className="sc-profile-card">
            <div className="sc-profile-card-heading">
              <div>
                <p className="sc-profile-section-label">YOUR PROFILE</p>
                <h2>Your profile</h2>
              </div>
              <span className="sc-profile-member-tag">Member</span>
            </div>

            <div className="sc-profile-identity">
              <div className="sc-profile-avatar">
                {displayedPicture ? (
                  <img
                    src={displayedPicture}
                    alt={`${name}'s profile`}
                    width="78"
                    height="78"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span>{name.trim().charAt(0).toUpperCase() || "M"}</span>
                )}
              </div>

              <div className="sc-profile-identity-details">
                <h3>{name}</h3>
                <p>{email || "No email address available"}</p>

                <button
                  type="button"
                  className="sc-profile-photo-button"
                  onClick={() => pictureInput.current?.click()}
                  disabled={pictureUploading}
                >
                  {pictureUploading
                    ? "Uploading..."
                    : savedPicture
                      ? "Change photo"
                      : "Add a profile photo"}
                </button>

                <input
                  ref={pictureInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sc-profile-file-input"
                  onChange={changeProfilePicture}
                  aria-label="Choose a profile photo"
                />

                {pictureMessage && (
                  <p className="sc-profile-photo-message" role="status">
                    {pictureMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="sc-profile-details-list">
              <div className="sc-profile-detail-row">
                <span>Full name</span>
                <strong>{name}</strong>
              </div>
              <div className="sc-profile-detail-row">
                <span>Email address</span>
                <strong>{email || "Not provided"}</strong>
              </div>
              {user?.phone && (
                <div className="sc-profile-detail-row">
                  <span>Phone number</span>
                  <strong>{user.phone}</strong>
                </div>
              )}
            </div>

            <div className="sc-profile-card-footer">
              <p>Need to update your account details?</p>
              <Link to="/profile/edit" className="sc-profile-text-link">
                Edit profile
              </Link>
            </div>
          </section>

          <section className="sc-profile-orders">
            <div className="sc-profile-orders-heading">
              <div>
                <p className="sc-profile-section-label">YOUR PURCHASES</p>
                <h2>Recent orders</h2>
                <p>Keep track of your latest pairs.</p>
              </div>
              <Link to="/orders" className="sc-profile-view-all">
                View all orders
              </Link>
            </div>

            {error && (
              <p className="sc-profile-error" role="alert">{error}</p>
            )}

            {!error && orders.length === 0 && (
              <div className="sc-profile-empty">
                <h3>No orders just yet</h3>
                <p>Your next favourite pair could be just around the corner.</p>
                <Link to="/" className="sc-profile-shop-link">
                  Explore the collection
                </Link>
              </div>
            )}

            {orders.length > 0 && (
              <div className="sc-profile-order-list">
                {orders.map((order) => {
                  const id = order.id || order._id;

                  return (
                    <article className="sc-profile-order" key={id}>
                      <div className="sc-profile-order-mark" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          width="21"
                          height="21"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M3 7.5h18v13H3z" />
                          <path d="M7 7.5V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2.5" />
                        </svg>
                      </div>

                      <div className="sc-profile-order-info">
                        <Link
                          to={`/orders/${id}`}
                          className="sc-profile-order-number"
                        >
                          {order.orderNo || `Order #${String(id).slice(-6)}`}
                        </Link>
                        <p>
                          {formatDate(order.createdAt)}
                          <span aria-hidden="true"> · </span>
                          {formatStatus(order.status)}
                        </p>
                      </div>

                      <div className="sc-profile-order-total">
                        <strong>{money(order.total || 0)}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <footer className="sc-profile-footer">
            <span>THE SNEAKER CO.</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="sc-profile-signout"
            >
              Sign out
            </button>
          </footer>
        </div>
      </div>
    </main>
  );
}
