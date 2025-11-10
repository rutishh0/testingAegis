import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!username.trim() || !password) {
      setLocalError('Username and password are required.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      await register(username.trim(), password);
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError('Unable to register.');
      }
    }
  };

  return (
    <div className="form-card">
      <div>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Create your secure account.</h1>
        <p style={{ margin: '8px 0 0', color: 'rgba(148, 163, 184, 0.85)' }}>
          Keys are generated locally and never leave your device unencrypted.
        </p>
      </div>

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
            placeholder="your.handle"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isLoading}
          />
        </div>

        <button type="submit" className="primary-button" disabled={isLoading}>
          {isLoading ? 'Generating keys…' : 'Create account'}
        </button>
      </form>

      <p style={{ fontSize: '0.9rem', color: 'rgba(148, 163, 184, 0.75)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#60a5fa' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

