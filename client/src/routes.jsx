import { createBrowserRouter, Navigate } from "react-router";
import MainLayout from "./components/MainLayout.jsx";
import AuthLayout from "./components/AuthLayout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Cart from "./pages/Cart.jsx";
import SignIn from "./pages/SignIn.jsx";
import Register from "./pages/Register.jsx";
import VerifyAccount from "./pages/VerifyAccount.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Profile from "./pages/Profile.jsx";
import AddressBook from "./pages/AddressBook.jsx";
import Balance from "./pages/Balance.jsx";
import Wallet from "./pages/Wallet.jsx";
import Checkout from "./pages/Checkout.jsx";
import PaymentFailed from "./pages/PaymentFailed.jsx";
import OrderConfirmed from "./pages/OrderConfirmed.jsx";
import OrderTracker from "./pages/OrderTracker.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import { adminRoutes } from "./admin/routes.jsx";

const router = createBrowserRouter([
  ...adminRoutes,
  {
    element: <AuthLayout />,
    children: [
      { path: "/signin", element: <SignIn /> },
      { path: "/register", element: <Register /> },
      { path: "/verify", element: <VerifyAccount /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/catalog", element: <Catalog /> },
      { path: "/product/:id", element: <ProductDetail /> },
      { path: "/wishlist", element: <Wishlist /> },
      { path: "/cart", element: <Cart /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "/profile", element: <Profile /> },
          { path: "/profile/edit", element: <Navigate to="/profile" replace /> },
          { path: "/profile/addresses", element: <AddressBook /> },
          { path: "/profile/balance", element: <Balance /> },
          { path: "/profile/wallet", element: <Wallet /> },
          { path: "/checkout", element: <Checkout /> },
          { path: "/payment-failed", element: <PaymentFailed /> },
          { path: "/orders", element: <MyOrders /> },
          { path: "/orders/:id", element: <OrderTracker /> },
          { path: "/orders/:id/confirmed", element: <OrderConfirmed /> },
        ],
      },
    ],
  },
]);

export default router;