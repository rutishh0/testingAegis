import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/chat';
  const registered = (location.state as { registered?: boolean })?.registered ?? false;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!username.trim() || !password) {
      setLocalError('Username and password are required.');
      return;
    }

    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError('Unable to sign in.');
      }
    }
  };

  return (
    <div className="form-card">
      <div>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Welcome back.</h1>
        <p style={{ margin: '8px 0 0', color: 'rgba(148, 163, 184, 0.85)' }}>
          Enter your credentials to unlock your secure inbox.
        </p>
      </div>

      {registered && (
        <div className="status-pill" style={{ alignSelf: 'flex-start' }}>
          Registration successful. Please sign in.
        </div>
      )}

      {(localError || error) && <div className="error-banner">{localError || error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={isLoading}
            placeholder="Choose wisely"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="primary-button" disabled={isLoading}>
          {isLoading ? 'Decrypting…' : 'Sign in'}
        </button>
      </form>

      <p style={{ fontSize: '0.9rem', color: 'rgba(148, 163, 184, 0.75)' }}>
        New to Aegis?{' '}
        <Link to="/register" style={{ color: '#60a5fa' }}>
          Create an account
        </Link>
      </p>
    </div>
  );
}

