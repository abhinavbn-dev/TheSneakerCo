import { Link, useParams } from "react-router";
export default function OrderConfirmed() {
  const { id } = useParams();
  return (
    <div className="sc-orderconfirmed-0340">
      <h1 className="sc-orderconfirmed-0341">Order confirmed</h1>
      <p className="sc-orderconfirmed-0342">Order <span className="sc-orderconfirmed-0343">{id}</span> is placed. A confirmation is on its way to your email.</p>
      <div className="sc-orderconfirmed-0344">
        <Link to={`/orders/${id}`} className="btn">Track order</Link>
        <Link to="/catalog" className="btn-outline">Keep shopping</Link>
      </div>
    </div>
  );
}
