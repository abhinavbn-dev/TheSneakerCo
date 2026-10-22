import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../services/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event) => {
    event.preventDefault();

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.forgotPassword(
        email.trim().toLowerCase()
      );

      setSuccess(
        result.message ||
          'If an account exists for this email, password reset instructions will be sent shortly.'
      );
    } catch (err) {
      setError(
        err.message ||
          'Unable to request a password reset. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="forgot-password-page">
      <form onSubmit={submit}>
        <h1>Forgot password?</h1>

        <p>
          Enter the email address associated with your account.
          We’ll send you instructions to reset your password.
        </p>

        <label htmlFor="forgot-password-email">
          Email address
        </label>

        <input
          id="forgot-password-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />

        {error && <p role="alert">{error}</p>}

        {success && <p role="status">{success}</p>}

        <button type="submit" disabled={busy}>
          {busy ? 'Sending...' : 'Send reset link'}
        </button>

        <p>
          Remember your password?{' '}
          <Link to="/signin">Sign in</Link>
        </p>
      </form>
    </main>
  );
}