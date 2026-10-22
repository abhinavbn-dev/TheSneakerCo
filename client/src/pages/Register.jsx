import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Field from "../components/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try { await register(form); navigate("/verify"); }
    catch (err) { setError(err.message); }
  };

  return (
    <form onSubmit={submit} className="sc-register-0408">
      <h1 className="sc-register-0409">Become a member</h1>
      <Field label="Full name" required value={form.name} onChange={set("name")} />
      <Field label="Email" type="email" required value={form.email} onChange={set("email")} />
      <Field label="Phone" type="tel" value={form.phone} onChange={set("phone")} />
      <Field label="Password" type="password" minLength={8} required value={form.password} onChange={set("password")} />
      {error && <p role="alert" className="sc-register-0410">{error}</p>}
      <button className="btn sc-register-0411">Create account</button>
      <p className="sc-register-0412">Already a member? <Link to="/signin" className="sc-register-0413">Sign in</Link></p>
    </form>
  );
}
