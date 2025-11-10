import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminContext } from '../state/AdminContext';

export default function LoginPage() {
  const { login, error } = useAdminContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!token.trim()) {
      setLocalError('Provide the admin API token issued by the platform.');
      return;
    }

    login(token.trim());
    navigate(from, { replace: true });
  };

  return (
    <div className="login-card">
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Master Admin Access</h1>
        <p style={{ margin: '8px 0 0', color: 'rgba(148, 163, 184, 0.8)' }}>
          Enter your admin API token to unlock the moderation console.
        </p>
      </div>

      {(localError || error) && <div className="error-banner">{localError || error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="input-group">
          <label htmlFor="admin-token">Admin API Token</label>
          <input
            id="admin-token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste secure token"
          />
        </div>

        <button type="submit" className="button primary">
          Enter Portal
        </button>
      </form>

      <p style={{ fontSize: '0.85rem', color: 'rgba(148, 163, 184, 0.7)' }}>
        You will be redirected to {from}. Keep the secret key offline until needed.
      </p>
    </div>
  );
}

