import { useState } from 'react';
import { useNavigate } from 'react-router';
import { adminLogin } from '../auth';
import '../admin.css';

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setLoading(true);

    try {
      await adminLogin(form.email.trim(), form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-root sc-adminlogin-0062">
      <form
        onSubmit={submit}
        className="sc-adminlogin-0063"
      >
        <h1 className="font-display sc-adminlogin-0064">
          Admin login
        </h1>

        <p className="sc-adminlogin-0065">
          The Sneaker Co.
        </p>

        <label
          className="font-mono-ui sc-adminlogin-0066"
          htmlFor="email"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={update}
          autoComplete="username"
          className="sc-adminlogin-0067"
          required
        />

        <label
          className="font-mono-ui sc-adminlogin-0068"
          htmlFor="password"
        >
          Password
        </label>

        <div className="sc-adminlogin-password-wrap">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={update}
            autoComplete="current-password"
            className="sc-adminlogin-0069 sc-adminlogin-password-input"
            required
          />

          <button
            type="button"
            className="sc-adminlogin-password-toggle"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7a11.5 11.5 0 01-3.1 4.2" />
                <path d="M6.2 6.2A12.3 12.3 0 002.5 12c1 2.5 4.5 7 9.5 7 1.3 0 2.5-.3 3.6-.8" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="sc-adminlogin-0070"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="font-mono-ui sc-adminlogin-0071"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}