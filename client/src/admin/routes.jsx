import { Navigate } from 'react-router';
import AdminLayout from './components/AdminLayout';
import RequireAdmin from './components/RequireAdmin';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import Coupons from './pages/Coupons';
import Offers from './pages/Offers';
import Analytics from './pages/Analytics';

export const adminRoutes = [
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'orders', element: <Orders /> },
      { path: 'products', element: <Products /> },
      { path: 'categories', element: <Categories /> },
      { path: 'customers', element: <Customers /> },
      { path: 'coupons', element: <Coupons /> },
      { path: 'offers', element: <Offers /> },
      { path: 'analytics', element: <Analytics /> },
    ],
  },
];