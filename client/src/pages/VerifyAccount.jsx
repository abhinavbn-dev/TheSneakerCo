
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const COOLDOWN_MS = 30 * 1000;
const RESEND_TIME_KEY = 'sneaker_otp_resend_available_at';

function readResendTime() {
  const value = Number(localStorage.getItem(RESEND_TIME_KEY) || 0);
  return Number.isFinite(value) ? value : 0;
}

export default function VerifyAccount() {
  const navigate = useNavigate();
  const { completeVerification } = useAuth();

  const email = localStorage.getItem('sneaker_pending_email') || '';

  const [previewUrl, setPreviewUrl] = useState(
    localStorage.getItem('sneaker_pending_preview_url') || ''
  );
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(readResendTime);
  const [now, setNow] = useState(Date.now());

  const refs = useRef([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsRemaining = Math.max(
    0,
    Math.ceil((resendAvailableAt - now) / 1000)
  );

  const countdown = `${String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}:${String(secondsRemaining % 60).padStart(2, '0')}`;

  const change = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!email) {
      setError('Register first so we know which email address to verify.');
      return;
    }

    if (digits.some((digit) => !digit)) {
      setError('Enter all six digits of your verification code.');
      return;
    }

    setBusy(true);

    try {
      const data = await api.verify(digits.join(''), email);
      completeVerification(data);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not verify your account.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!email || resendBusy || busy || secondsRemaining > 0) return;

    setError('');
    setNotice('');
    setResendBusy(true);

    try {
      const data = await api.resendVerification(email);

      const nextAvailableAt =
        Number(data.resendAvailableAt) || Date.now() + COOLDOWN_MS;

      setResendAvailableAt(nextAvailableAt);
      localStorage.setItem(RESEND_TIME_KEY, String(nextAvailableAt));

      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
        localStorage.setItem('sneaker_pending_preview_url', data.previewUrl);
      } else {
        setPreviewUrl('');
        localStorage.removeItem('sneaker_pending_preview_url');
      }

      setDigits(Array(6).fill(''));
      refs.current[0]?.focus();

      setNotice(data.message || 'A new verification code has been sent.');
    } catch (err) {
      if (err.retryAfterSeconds) {
        const nextAvailableAt =
          Date.now() + Number(err.retryAfterSeconds) * 1000;

        setResendAvailableAt(nextAvailableAt);
        localStorage.setItem(RESEND_TIME_KEY, String(nextAvailableAt));
      }

      setError(err.message || 'Could not resend the OTP. Please try again.');
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="sc-verifyaccount-0420">
      <h1 className="sc-verifyaccount-0421">Verify account</h1>

      {email ? (
        <p className="sc-verifyaccount-0422">
          Enter the six-digit code sent to <strong>{email}</strong>.
        </p>
      ) : (
        <p className="sc-verifyaccount-0423">
          No pending registration was found.{' '}
          <Link className="sc-verifyaccount-0424" to="/register">
            Register again
          </Link>.
        </p>
      )}

      {previewUrl && (
        <p className="sc-verifyaccount-0425">
          Development email preview:{' '}
          <a
            className="sc-verifyaccount-0426"
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open OTP email
          </a>
        </p>
      )}

      <div className="sc-verifyaccount-0427">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={digit}
            onChange={(event) => change(index, event.target.value)}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${index + 1}`}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            onKeyDown={(event) => {
              if (
                event.key === 'Backspace' &&
                !digit &&
                index > 0
              ) {
                refs.current[index - 1]?.focus();
              }
            }}
            className="sc-verifyaccount-0428"
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="sc-verifyaccount-0429">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="sc-verifyaccount-0431">
          {notice}
        </p>
      )}

      <button
        type="submit"
        className="btn sc-verifyaccount-0430"
        disabled={
          busy ||
          resendBusy ||
          !email ||
          digits.some((digit) => !digit)
        }
      >
        {busy ? 'Verifying…' : 'Verify account'}
      </button>

      <div className="sc-verifyaccount-0432">
        <span className="sc-verifyaccount-0433">
          Didn't receive the code?
        </span>

        <button
          type="button"
          className="sc-verifyaccount-0434"
          onClick={resend}
          disabled={
            !email ||
            resendBusy ||
            busy ||
            secondsRemaining > 0
          }
        >
          {resendBusy
            ? 'Sending…'
            : secondsRemaining > 0
              ? `Resend OTP in ${countdown}`
              : 'Resend OTP'}
        </button>
      </div>
    </form>
  );
}
