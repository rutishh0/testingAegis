import { FormEvent, useState } from 'react';
import { useAdminContext } from '../state/AdminContext';

export default function SecretKeyManager() {
  const { adminSecretKey, setAdminSecretKeyFromBase64 } = useAdminContext();
  const [inputValue, setInputValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!inputValue.trim()) {
      setLocalError('Paste your ADMIN_SECRET_KEY to enable decryption.');
      return;
    }

    setAdminSecretKeyFromBase64(inputValue);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      setInputValue(content.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to read file.';
      setLocalError(message);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Admin Secret Key</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(148, 163, 184, 0.75)' }}>
            Load your secret key to decrypt payloads locally. Never upload this to the server.
          </p>
        </div>
      </header>

      {adminSecretKey ? (
        <div className="status-pill">
          <span>Secret key loaded</span>
        </div>
      ) : (
        <div className="status-pill danger">Secret key not loaded</div>
      )}

      {localError && <div className="error-banner">{localError}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="input-group">
          <label htmlFor="secret-key-textarea">Paste ADMIN_SECRET_KEY</label>
          <textarea
            id="secret-key-textarea"
            rows={4}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="ADMIN_SECRET_KEY base64 string"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="button secondary" style={{ cursor: 'pointer' }}>
            Load from file
            <input type="file" accept=".txt,.key" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button type="submit" className="button primary">
            Load key
          </button>
        </div>
      </form>
    </div>
  );
}

