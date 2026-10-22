import { useState } from "react";
import AccountNav from "../components/AccountNav.jsx";
import Field from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateMe({ ...form, ...(pw.next ? { currentPassword: pw.current, newPassword: pw.next } : {}) });
      setUser(updated.user ?? { ...user, ...form });
      setMsg("Changes saved.");
    } catch (err) { setMsg(err.message); }
  };

  return (
    <div className="sc-editprofile-0311">
      <AccountNav />
      <form onSubmit={save} className="sc-editprofile-0312">
        <h1 className="sc-editprofile-0313">Edit profile</h1>
        <section className="sc-editprofile-0314">
          <h2 className="sc-editprofile-0315">Personal & contact details</h2>
          <Field label="Full name" value={form.name} onChange={set("name")} />
          <Field label="Email" type="email" value={form.email} onChange={set("email")} />
          <Field label="Phone" type="tel" value={form.phone} onChange={set("phone")} />
        </section>
        <section className="sc-editprofile-0316">
          <h2 className="sc-editprofile-0317">Security & payment</h2>
          <Field label="Current password" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <Field label="New password" type="password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        </section>
        {msg && <p role="status" className="sc-editprofile-0318">{msg}</p>}
        <button className="btn">Save changes</button>
      </form>
    </div>
  );
}
