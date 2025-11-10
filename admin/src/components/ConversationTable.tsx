import { Fragment, useMemo, useState } from 'react';
import { useAdminContext } from '../state/AdminContext';
import { useAdminDecryption } from '../hooks/useAdminDecryption';

export default function ConversationTable() {
  const { messages, selectedUserId, selectedPeerId, selectConversation } = useAdminContext();
  const { canDecrypt, decryptPayload } = useAdminDecryption();
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const groupMap = new Map<
      string,
      {
        key: string;
        userId: string;
        peerId: string;
        participants: {
          userId: string;
          username: string;
          publicKey: string;
        }[];
        entries: typeof messages;
      }
    >();

    const ordered = [...messages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );

    ordered.forEach((message) => {
      const participants = [message.senderId, message.recipientId].sort();
      const key = participants.join(':');
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          userId: participants[0],
          peerId: participants[1],
          participants: [
            {
              userId: message.senderId,
              username: message.senderUsername,
              publicKey: message.senderPublicKey,
            },
            {
              userId: message.recipientId,
              username: message.recipientUsername,
              publicKey: message.recipientPublicKey,
            },
          ],
          entries: [],
        });
      }
      groupMap.get(key)?.entries.push(message);
    });

    return Array.from(groupMap.values()).map((group) => {
      const { entries, participants } = group;
      const [participantA, participantB] = participants;

      const loaded = entries.map((entry) => {
        const plaintext = canDecrypt
          ? decryptPayload(entry.payloadAdmin, entry.nonce, entry.senderPublicKey)
          : null;

        return {
          ...entry,
          plaintext,
        };
      });

      return {
        ...group,
        participants: [
          {
            userId: participantA.userId,
            username: participantA.username,
          },
          {
            userId: participantB.userId,
            username: participantB.username,
          },
        ],
        entries: loaded,
      };
    });
  }, [canDecrypt, decryptPayload, messages]);

  const filtered = useMemo(() => {
    if (!query.trim()) return grouped;
    const q = query.trim().toLowerCase();
    return grouped.filter(({ participants }) =>
      participants.some((participant) => participant.username.toLowerCase().includes(q))
    );
  }, [grouped, query]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Conversations</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(148, 163, 184, 0.75)' }}>
            Select a thread to review decrypted messages in chronological order.
          </p>
        </div>
      </header>

      <div className="input-group">
        <label htmlFor="conversation-filter">Filter by username</label>
        <input
          id="conversation-filter"
          placeholder="Start typing to narrow results…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="scrollable">
        {filtered.length === 0 ? (
          <div className="empty-state">No messages available.</div>
        ) : (
          filtered.map(({ userId, peerId, entries, participants }) => {
            const isActive =
              (userId === selectedUserId && peerId === selectedPeerId) ||
              (userId === selectedPeerId && peerId === selectedUserId);
            return (
              <Fragment key={`${userId}:${peerId}`}>
                <button
                  type="button"
                  className={`button ${isActive ? 'primary' : 'secondary'}`}
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => selectConversation(userId, peerId)}
                >
                  <span>
                    {participants[0]?.username ?? userId} ↔ {participants[1]?.username ?? peerId}
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {new Date(entries[entries.length - 1].sentAt).toLocaleString()}
                  </span>
                </button>
                {isActive && (
                  <div className="card" style={{ background: 'rgba(15, 23, 42, 0.75)' }}>
                    <div className="scrollable">
                      {entries.map((entry) => (
                        <article key={entry.messageId} className="message-entry">
                          <div className="meta">
                            <span>
                              {entry.senderUsername} → {entry.recipientUsername}
                            </span>
                            <span>{new Date(entry.sentAt).toLocaleString()}</span>
                          </div>
                          <div className="body">
                            {entry.plaintext ? entry.plaintext : <em>Encrypted payload unavailable.</em>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}

