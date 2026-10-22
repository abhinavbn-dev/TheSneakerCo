import { NavLink, Outlet, useNavigate } from 'react-router';
import { useState } from 'react';
import { navItems } from '../data/adminData';
import { Button } from './ui';
import { clearToken } from '../auth';
import '../admin.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = () => {
    clearToken();
    navigate('/admin/login');
  };

  return (
    <div className="admin-root sc-adminlayout-0001">
      <aside
        className={`${open ? 'sc-adminlayout-0002' : 'sc-adminlayout-0003'} sc-adminlayout-0004`}
      >
        <div className="sc-adminlayout-0005">
          <p className="font-display sc-adminlayout-0006">The Sneaker Co.</p>
          <p className="font-mono-ui sc-adminlayout-0007">Admin console</p>
        </div>
        <nav className="sc-adminlayout-0008" aria-label="Admin">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `font-mono-ui sc-adminlayout-0009 ${
                  isActive ? 'sc-adminlayout-0010' : 'sc-adminlayout-0011'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="sc-adminlayout-0012">
        <header className="sc-adminlayout-0013">
          <button className="font-mono-ui sc-adminlayout-0014" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            Menu
          </button>
          <p className="font-mono-ui sc-adminlayout-0015">Bengaluru flagship · live</p>
          <div className="sc-adminlayout-0016">
            <span className="sc-adminlayout-0017">AD</span>
            <Button onClick={signOut}>Sign out</Button>
          </div>
        </header>
        <main className="sc-adminlayout-0018">
          <Outlet />
        </main>
        <footer className="font-mono-ui sc-adminlayout-0019">
          The Sneaker Co. · Admin
        </footer>
      </div>
    </div>
  );
}