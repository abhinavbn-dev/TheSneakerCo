import { useMemo, useState } from 'react';

const tones = {
  neutral: 'sc-ui-0021',
  good: 'sc-ui-0022',
  warn: 'sc-ui-0023',
  bad: 'sc-ui-0024',
};

const statusTone = {
  Active: 'good', Live: 'good', Paid: 'good', Delivered: 'good',
  Shipped: 'neutral', Processing: 'warn', Pending: 'warn', Scheduled: 'warn', Draft: 'neutral',
  'Low stock': 'warn', Flagged: 'warn',
  Blocked: 'bad', Failed: 'bad', Cancelled: 'bad', 'Out of stock': 'bad', Expired: 'bad', Hidden: 'neutral',
};

export function Badge({ children, tone }) {
  return (
    <span className={`font-mono-ui sc-ui-0025 ${tones[tone || statusTone[children] || 'neutral']}`}>
      {children}
    </span>
  );
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`sc-ui-0026 ${className}`}>
      {(title || action) && (
        <header className="sc-ui-0027">
          <h2 className="font-mono-ui sc-ui-0028">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="sc-ui-0029">
      <div>
        <h1 className="font-display sc-ui-0030">{title}</h1>
        {subtitle && <p className="sc-ui-0031">{subtitle}</p>}
      </div>
      <div className="sc-ui-0032">{actions}</div>
    </div>
  );
}

export function Button({ variant = 'ghost', className = '', ...props }) {
  const styles =
    variant === 'primary'
      ? 'sc-ui-0033'
      : variant === 'danger'
      ? 'sc-ui-0034'
      : 'sc-ui-0035';
  return (
    <button
      className={`font-mono-ui sc-ui-0036 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Stat({ label, value, hint, accent }) {
  return (
    <div className="sc-ui-0037">
      <p className="font-mono-ui sc-ui-0038">{label}</p>
      <p className={`font-display sc-ui-0039 ${accent ? 'sc-ui-0040' : 'sc-ui-0041'}`}>{value}</p>
      {hint && <p className="sc-ui-0042">{hint}</p>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="sc-ui-0043" role="tablist">
      {tabs.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={value === t}
          onClick={() => onChange(t)}
          className={`font-mono-ui sc-ui-0044 ${
            value === t ? 'sc-ui-0045' : 'sc-ui-0046'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="font-mono-ui sc-ui-0047"
    />
  );
}

export function DataTable({ columns, rows, rowKey = 'id', empty = 'Nothing matches these filters.' }) {
  return (
    <div className="sc-ui-0048">
      <table className="sc-ui-0049">
        <thead>
          <tr className="sc-ui-0050">
            {columns.map((c) => (
              <th key={c.label} className={`font-mono-ui sc-ui-0051 ${c.align === 'right' ? 'sc-ui-0052' : ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="sc-ui-0053">{empty}</td></tr>
          )}
          {rows.map((row) => (
            <tr key={row[rowKey]} className="sc-ui-0054">
              {columns.map((c) => (
                <td key={c.label} className={`sc-ui-0055 ${c.align === 'right' ? 'sc-ui-0056' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function usePaged(rows, size = 6) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const safePage = Math.min(page, pages);
  const slice = useMemo(() => rows.slice((safePage - 1) * size, safePage * size), [rows, safePage, size]);
  return { slice, page: safePage, pages, setPage, total: rows.length };
}

export function Pager({ page, pages, setPage, total }) {
  return (
    <div className="font-mono-ui sc-ui-0057">
      <span>{total} records</span>
      <div className="sc-ui-0058">
        <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
        <span>{page} / {pages}</span>
        <Button disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = 'sc-ui-0059' }) {
  return (
    <div className="sc-ui-0060" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={`sc-ui-0061 ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
