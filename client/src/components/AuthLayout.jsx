import { Outlet } from "react-router";
import Logo from "./Logo.jsx";
import Footer from "./Footer.jsx";

export default function AuthLayout() {
  return (
    <>
      <header className="sc-authlayout-0213"><Logo /></header>
      <main className="sc-authlayout-0214">
        <div className="sc-authlayout-0215"><Outlet /></div>
      </main>
      <Footer />
    </>
  );
}
