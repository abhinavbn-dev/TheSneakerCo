
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useLocation, useNavigate } from 'react-router';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function SignIn() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finishLogin = () => {
    const destination = location.state?.from;

    // Only navigate to a valid internal path.
    const safeDestination =
      typeof destination === 'string' &&
      destination.startsWith('/') &&
      !destination.startsWith('//') &&
      destination !== '/signin' &&
      destination !== '/register'
        ? destination
        : '/';

    navigate(safeDestination, { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await login(form);
      finishLogin();
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  const googleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google did not return a valid sign-in credential.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      await loginWithGoogle(credentialResponse.credential);
      finishLogin();
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="sc-signin-0414">
      <h1 className="sc-signin-0415">Sign in</h1>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '20px 0',
        }}
      >
        <span style={{ flex: 1, height: 1, background: '#ddd' }} />
        <span style={{ color: '#777', fontSize: 13 }}>
        </span>
        <span style={{ flex: 1, height: 1, background: '#ddd' }} />
      </div>

      <Field
        label="Email"
        type="email"
        required
        value={form.email}
        onChange={(event) =>
          setForm({ ...form, email: event.target.value })
        }
      />

      <div className="signin-password-section">
        <div className="signin-password-heading">
          <label htmlFor="signin-password" className="label">
            Password
          </label>

          <Link to="/forgot-password" className="signin-forgot-link">
            Forgot password?
          </Link>
        </div>

        <div className="signin-password-control">
          <input
            id="signin-password"
            className="input signin-password-input"
            type={showPassword ? 'text' : 'password'}
            required
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
          />

          <button
            type="button"
            className="signin-password-toggle"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="sc-signin-0416">
          {error}
        </p>
      )}

      <button className="btn sc-signin-0417" disabled={busy}>
        {busy ? 'Signing in...' : 'Sign in'}
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '20px 0',
        }}
      >
        <span style={{ flex: 1, height: 1, background: '#ddd' }} />
        <span style={{ color: '#777', fontSize: 13 }}>
          OR SIGN IN WITH GOOGLE
        </span>
        <span style={{ flex: 1, height: 1, background: '#ddd' }} />
      </div>

      <div
        style={{
          display: 'grid',
          justifyItems: 'center',
          gap: 12,
          margin: '20px 0',
        }}
      >
        <GoogleLogin
          onSuccess={googleSuccess}
          onError={() =>
            setError('Google sign-in was cancelled or failed.')
          }
          text="continue_with"
          shape="rectangular"
          size="large"
          width="320"
          useOneTap={false}
        />
      </div>

      <p className="sc-signin-0418">
        New here?{' '}
        <Link to="/register" className="sc-signin-0419">
          Become a member
        </Link>
      </p>
    </form>
  );
}
