
import { Link } from "react-router";

export default function Logo() {
  return (
    <Link
      to="/"
      className="store-logo"
      aria-label="The Sneaker Co. Home"
    >
      The Sneaker Co.
    </Link>
  );
}
