import { useEffect, useState } from 'react';
import AccountNav from '../components/AccountNav.jsx';
import { api } from '../services/api.js';
import { money } from '../utils.js';

export default function Wallet() {
  const [wallet, setWallet] = useState({ balance: 0 });
  const [amount, setAmount] = useState(1000); const [method, setMethod] = useState('upi'); const [msg, setMsg] = useState('');
  useEffect(() => { let alive = true; api.getWallet().then((data) => alive && setWallet(data)).catch(() => {}); return () => { alive = false; }; }, []);
  return <div className="sc-wallet-0431">
    <AccountNav />
    <div className="sc-wallet-0432"><h1 className="sc-wallet-0433">Wallet & credits</h1>
      <div className="sc-wallet-0434"><div className="card"><p className="label">Wallet balance</p><p className="sc-wallet-0435">{money(wallet.balance || 0)}</p></div><div className="card"><p className="label">Reward points</p><p className="sc-wallet-0436">—</p></div><div className="card"><p className="label">Store credit</p><p className="sc-wallet-0437">{money(0)}</p></div></div>
      <section className="card sc-wallet-0438"><h2 className="sc-wallet-0439">Add money</h2><p className="sc-wallet-0440">Wallet top-ups are a UI demo until a payment provider is integrated. No payment will be charged.</p>
        <div className="sc-wallet-0441">{[500, 1000, 5000].map((value) => <button key={value} onClick={() => setAmount(value)} className={`sc-wallet-0442 ${amount === value ? 'sc-wallet-0443' : ''}`}>{money(value)}</button>)}</div>
        <select className="input" value={method} onChange={(event) => setMethod(event.target.value)}><option value="upi">UPI</option><option value="card">Card</option><option value="netbanking">Net banking</option></select>
        <button className="btn" onClick={() => setMsg(`Demo only: a ${money(amount)} top-up via ${method.toUpperCase()} is not processed yet.`)}>Add {money(amount)}</button>{msg && <p role="status" className="sc-wallet-0444">{msg}</p>}
      </section>
    </div>
  </div>;
}
