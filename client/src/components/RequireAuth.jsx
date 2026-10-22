import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

export default function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  const enforced = import.meta.env.VITE_REQUIRE_AUTH === "true";
  if (enforced && !user) return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
