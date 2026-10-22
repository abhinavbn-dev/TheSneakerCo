
import { NavLink } from "react-router";

const items = [
  { to: "/profile/edit", label: "Edit profile" },
  { to: "/profile/addresses", label: "Address book" },
  { to: "/profile/balance", label: "Balance" },
  { to: "/profile/wallet", label: "Wallet & credits" },
  { to: "/orders", label: "My orders" },
];

export default function AccountNav() {
  return (
    <div className="sc-accountnav">
      <h1>My account</h1>
      <nav className="sc-accountnav-0209" aria-label="Account navigation">
        {items.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `sc-accountnav-0210 ${
                isActive ? "sc-accountnav-0211" : "sc-accountnav-0212"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
