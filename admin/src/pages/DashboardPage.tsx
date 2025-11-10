import { useMemo } from 'react';
import SecretKeyManager from '../components/SecretKeyManager';
import ConversationTable from '../components/ConversationTable';
import { useAdminContext } from '../state/AdminContext';
import { useAdminDecryption } from '../hooks/useAdminDecryption';

export default function DashboardPage() {
  const { token, messages, isLoading, error, refreshMessages, logout } = useAdminContext();
  const { canDecrypt } = useAdminDecryption();

  const totalConversations = useMemo(() => {
    const keys = new Set<string>();
    messages.forEach((msg) => {
      const pair = [msg.senderId, msg.recipientId].sort().join(':');
      keys.add(pair);
    });
    return keys.size;
  }, [messages]);

  return (
    <>
      <header className="admin-header">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Aegis Moderation Console</h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(148, 163, 184, 0.75)' }}>
            Review encrypted conversations with master oversight.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="button secondary"
            disabled={isLoading}
            onClick={refreshMessages}
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" className="button secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="admin-main">
        <aside className="sidebar">
          <SecretKeyManager />
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0 }}>Portal status</h3>
            <div className="status-pill">
              <span>Total messages</span>
              <strong>{messages.length}</strong>
            </div>
            <div className="status-pill">
              <span>Conversations</span>
              <strong>{totalConversations}</strong>
            </div>
            <div className={`status-pill ${canDecrypt ? '' : 'danger'}`}>
              <span>Decryption</span>
              <strong>{canDecrypt ? 'Enabled' : 'Secret key required'}</strong>
            </div>
            {token && (
              <p style={{ fontSize: '0.75rem', color: 'rgba(148, 163, 184, 0.7)' }}>
                You are authenticated with an admin API token. Keep it secured.
              </p>
            )}
          </div>
        </aside>

        <section className="content">
          {error && <div className="error-banner">{error}</div>}
          <ConversationTable />
        </section>
      </main>
    </>
  );
}

