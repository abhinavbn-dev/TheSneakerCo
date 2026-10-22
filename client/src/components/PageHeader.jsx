export default function PageHeader({ title, children }) {
  return (
    <div className="sc-pageheader-0227">
      <h1 className="sc-pageheader-0228">{title}</h1>
      <div className="sc-pageheader-0229">{children}</div>
    </div>
  );
}
