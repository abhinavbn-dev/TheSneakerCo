import { Outlet, ScrollRestoration, useLocation } from "react-router";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";

export default function MainLayout() {
  const { pathname } = useLocation();

  return (
    <>
      <Navbar />
      <main className="sc-mainlayout-0221"><Outlet /></main>
      {pathname !== "/" && <Footer />}
      <ScrollRestoration />
    </>
  );
}
