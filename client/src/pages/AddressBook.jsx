import { useEffect, useState } from "react";
import AccountNav from "../components/AccountNav.jsx";
import Field from "../components/Field.jsx";
import { api } from "../services/api.js";

const empty = { name: "", line1: "", city: "", state: "", pincode: "", phone: "" };

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(empty);
  const [adding, setAdding] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { api.getAddresses().then((d) => setAddresses(d.addresses ?? d)).catch(() => {}); }, []);

  const save = async (e) => {
    e.preventDefault();
    try { const a = await api.saveAddress(form); setAddresses((p) => [...p, a.address ?? a]); }
    catch { setAddresses((p) => [...p, { ...form, _id: crypto.randomUUID() }]); }
    setForm(empty); setAdding(false);
  };
  const remove = async (id) => {
    setAddresses((p) => p.filter((a) => a._id !== id));
    api.deleteAddress(id).catch(() => {});
  };

  return (
    <div className="sc-addressbook-0239">
      <AccountNav />
      <div className="sc-addressbook-0240">
        <div className="sc-addressbook-0241"><h1 className="sc-addressbook-0242">Address book</h1>
          <button className="btn" onClick={() => setAdding(!adding)}>{adding ? "Cancel" : "Add address"}</button></div>
        {adding && (
          <form onSubmit={save} className="card sc-addressbook-0243">
            <Field label="Full name" required value={form.name} onChange={set("name")} />
            <Field label="Phone" required value={form.phone} onChange={set("phone")} />
            <div className="sc-addressbook-0244"><Field label="Address" required value={form.line1} onChange={set("line1")} /></div>
            <Field label="City" required value={form.city} onChange={set("city")} />
            <Field label="State" required value={form.state} onChange={set("state")} />
            <Field label="Pincode" required value={form.pincode} onChange={set("pincode")} />
            <div className="sc-addressbook-0245"><button className="btn">Save address</button></div>
          </form>
        )}
        <div className="sc-addressbook-0246">
          {addresses.map((a) => (
            <div key={a._id} className="card sc-addressbook-0247">
              <p className="sc-addressbook-0248">{a.name}</p>
              <p>{a.line1}, {a.city}, {a.state} {a.pincode}</p>
              <p className="sc-addressbook-0249">{a.phone}</p>
              <button onClick={() => remove(a._id)} className="sc-addressbook-0250">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
