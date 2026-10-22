import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { api } from '../services/api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!token) {
      setError(
        'This password-reset link is invalid or incomplete. Please request a new one.'
      );
      return;
    }

    if (password.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      const result = await api.resetPassword(token, password);

      setSuccess(
        result.message ||
          'Your password has been reset successfully. You can now sign in.'
      );
    } catch (err) {
      setError(
        err.message ||
          'Unable to reset your password. The link may have expired.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="forgot-password-page">
      <form onSubmit={submit}>
        <h1>Reset password</h1>

        <p>Enter and confirm your new password below.</p>

        <label htmlFor="reset-password">
          New password
        </label>

        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
        />

        <label htmlFor="confirm-reset-password">
          Confirm new password
        </label>

        <input
          id="confirm-reset-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          placeholder="Enter your new password again"
        />

        {error && <p role="alert">{error}</p>}

        {success && <p role="status">{success}</p>}

        {success ? (
          <button
            type="button"
            onClick={() => navigate('/signin')}
          >
            Go to sign in
          </button>
        ) : (
          <button type="submit" disabled={busy || !token}>
            {busy ? 'Resetting...' : 'Reset password'}
          </button>
        )}

        <p>
          <Link to="/signin">Back to sign in</Link>
        </p>
      </form>
    </main>
  );
}