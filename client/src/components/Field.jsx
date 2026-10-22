export default function Field({ label, ...props }) {
  return (
    <label className="sc-field-0216">
      <span className="label">{label}</span>
      <input className="input" {...props} />
    </label>
  );
}
