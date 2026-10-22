import { useEffect, useState } from "react";
import AccountNav from "../components/AccountNav.jsx";
import { transactions as seed } from "../data/products.js";
import { api } from "../services/api.js";
import { money } from "../utils.js";

export default function Balance() {
  const [txns, setTxns] = useState(seed);
  useEffect(() => { api.getTransactions().then((d) => setTxns(d.transactions ?? d)).catch(() => {}); }, []);
  const balance = txns.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="sc-balance-0251">
      <AccountNav />
      <div className="sc-balance-0252">
        <h1 className="sc-balance-0253">Balance & transactions</h1>
        <div className="sc-balance-0254"><p className="label sc-balance-0255">Available balance</p><p className="sc-balance-0256">{money(balance)}</p></div>
        <table className="sc-balance-0257">
          <thead><tr className="sc-balance-0258"><th className="sc-balance-0259">Date</th><th>Details</th><th className="sc-balance-0260">Amount</th></tr></thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.id} className="sc-balance-0261">
                <td className="sc-balance-0262">{t.date}</td><td>{t.note}</td>
                <td className={`sc-balance-0263 ${t.amount < 0 ? "" : "sc-balance-0264"}`}>{t.amount < 0 ? "-" : "+"}{money(Math.abs(t.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
