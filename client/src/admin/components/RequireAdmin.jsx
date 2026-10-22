import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { adminFetch, getToken, clearToken } from '../auth';

export default function RequireAdmin({ children }) {
  const [state, setState] = useState(getToken() ? 'checking' : 'denied');

  useEffect(() => {
    if (!getToken()) return;
    adminFetch('/auth/me')
      .then(({ user }) => setState(user.role === 'admin' ? 'ok' : 'denied'))
      .catch(() => {
        clearToken();
        setState('denied');
      });
  }, []);

  if (state === 'checking') {
    return <div className="sc-requireadmin-0020">Checking your session…</div>;
  }
  if (state === 'denied') return <Navigate to="/admin/login" replace />;
  return children;
}