import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, useSocket } from '../contexts/AuthContext';
import { fetchMessages, fetchUsers, sendMessage } from '../services/api';
import { decryptMessage, encryptMessage } from '../services/crypto';
import type { ApiUser, MessageRecord, PlainMessage } from '../types';

function formatTimestamp(timestamp: Date) {
  return timestamp.toLocaleString();
}

export default function ChatPage() {
  const { user, token, secretKey, adminPublicKey, logout, error } = useAuth();
  const socket = useSocket();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PlainMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [composerValue, setComposerValue] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const sentMessageCache = useRef<Map<string, string>>(new Map());
  const listRef = useRef<HTMLDivElement | null>(null);

  const usersById = useMemo(() => {
    const map = new Map<string, ApiUser>();
    users.forEach((u) => map.set(u.userId, u));
    if (user) {
      map.set(user.userId, user);
    }
    return map;
  }, [user, users]);

  const scrollToBottom = useCallback(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, []);

  const transformMessageRecord = useCallback(
    (record: MessageRecord): PlainMessage => {
      const isOutbound = record.senderId === user?.userId;
      const sentAt = new Date(record.sentAt);

      if (!secretKey || !user) {
        return {
          id: record.messageId,
          senderId: record.senderId,
          recipientId: record.recipientId,
          body: '[locked]',
          sentAt,
        };
      }

      const sender = usersById.get(record.senderId);
      const recipient = usersById.get(record.recipientId);

      let body: string | null = null;

      if (!isOutbound) {
        if (sender) {
          body = decryptMessage(record.payloadRecipient, record.nonce, sender.publicKey, secretKey);
        }
      } else {
        const cached = sentMessageCache.current.get(record.messageId);
        if (cached) {
          body = cached;
        }
      }

      if (!body) {
        body = isOutbound ? '[encrypted message sent]' : '[encrypted message received]';
      }

      return {
        id: record.messageId,
        senderId: record.senderId,
        recipientId: record.recipientId,
        body,
        sentAt,
      };
    },
    [secretKey, user, usersById]
  );

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setUsersLoading(true);
    setGlobalError(null);
    try {
      const { users: fetchedUsers } = await fetchUsers(token);
      const peers = fetchedUsers.filter((u) => u.userId !== user?.userId);
      setUsers(peers);
      if (peers.length === 0) {
        setSelectedUserId(null);
      } else if (!selectedUserId) {
        setSelectedUserId(peers[0].userId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users.';
      setGlobalError(message);
    } finally {
      setUsersLoading(false);
    }
  }, [selectedUserId, token, user?.userId]);

  const loadMessages = useCallback(
    async (peerId: string) => {
      if (!token) return;
      setMessagesLoading(true);
      setGlobalError(null);
      try {
        const { messages: fetchedMessages } = await fetchMessages(token, peerId);
        const mapped = fetchedMessages.map(transformMessageRecord);
        setMessages(mapped);
        setTimeout(scrollToBottom, 0);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load conversation.';
        setGlobalError(message);
      } finally {
        setMessagesLoading(false);
      }
    },
    [token, transformMessageRecord, scrollToBottom]
  );

  useEffect(() => {
    if (token && secretKey) {
      loadUsers();
    }
  }, [loadUsers, secretKey, token]);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    } else {
      setMessages([]);
    }
  }, [loadMessages, selectedUserId]);

  useEffect(() => {
    if (!socket) return undefined;

    const handler = (record: MessageRecord) => {
      if (!user) return;
      if (record.senderId !== user.userId && record.recipientId !== user.userId) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === record.messageId);
        if (exists) return prev;

        const mapped = transformMessageRecord(record);
        return [...prev, mapped];
      });
      setTimeout(scrollToBottom, 0);
    };

    socket.on('message:new', handler);

    return () => {
      socket.off('message:new', handler);
    };
  }, [scrollToBottom, socket, transformMessageRecord, user]);

  const handleSelectUser = useCallback(
    (peerId: string) => {
      if (peerId === selectedUserId) return;
      setSelectedUserId(peerId);
      setMessages([]);
    },
    [selectedUserId]
  );

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !secretKey || !adminPublicKey || !user) {
      setComposerError('Unable to send message. Missing keys.');
      return;
    }

    if (!selectedUserId) {
      setComposerError('Choose a user to start messaging.');
      return;
    }

    if (!composerValue.trim()) {
      setComposerError('Type a message before sending.');
      return;
    }

    const targetUser = usersById.get(selectedUserId);
    if (!targetUser) {
      setComposerError('Recipient no longer available.');
      return;
    }

    setComposerError(null);
    const messageBody = composerValue.trim();
    setComposerValue('');

    try {
      const encrypted = encryptMessage(messageBody, secretKey, targetUser.publicKey, adminPublicKey);
      const payload = {
        recipientId: targetUser.userId,
        payload_recipient: encrypted.payloadRecipient,
        payload_admin: encrypted.payloadAdmin,
        nonce: encrypted.nonce,
      };

      const record = await sendMessage(token, payload);

      sentMessageCache.current.set(record.messageId, messageBody);

      setMessages((prev) => [
        ...prev,
        {
          id: record.messageId,
          senderId: user.userId,
          recipientId: targetUser.userId,
          body: messageBody,
          sentAt: new Date(record.sentAt),
        },
      ]);
      setTimeout(scrollToBottom, 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message.';
      setComposerError(message);
    }
  };

  if (!user) {
    return null;
  }

  const activeUser = selectedUserId ? usersById.get(selectedUserId) : null;

  return (
    <div className="layout">
      <aside className="panel" style={{ borderRight: '1px solid rgba(148, 163, 184, 0.2)' }}>
        <header className="chat-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{user.username}</h2>
            <span style={{ fontSize: '0.8rem', color: 'rgba(148, 163, 184, 0.75)' }}>Hybrid Admin-Key user</span>
          </div>
          <button type="button" className="secondary-button" onClick={logout} style={{ alignSelf: 'flex-start' }}>
            Sign out
          </button>
        </header>

        <section>
          <h3 style={{ marginBottom: '12px', fontSize: '1rem' }}>People</h3>
          {usersLoading && <div className="status-pill">Loading directory…</div>}
          {globalError && <div className="error-banner">{globalError}</div>}
          <div className="user-list">
            {users.map((peer) => (
              <button
                key={peer.userId}
                type="button"
                className={peer.userId === selectedUserId ? 'active' : ''}
                onClick={() => handleSelectUser(peer.userId)}
              >
                <span>{peer.username}</span>
                <span className="status-pill">Secure</span>
              </button>
            ))}
            {users.length === 0 && !usersLoading && (
              <p style={{ color: 'rgba(148, 163, 184, 0.7)', fontSize: '0.9rem' }}>
                No other users yet. Invite someone to join the platform.
              </p>
            )}
          </div>
        </section>
      </aside>

      <main className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
        {activeUser ? (
          <>
            <header className="chat-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0 }}>{activeUser.username}</h2>
                <span style={{ fontSize: '0.85rem', color: 'rgba(148, 163, 184, 0.75)' }}>
                  Messages are encrypted device-side with admin visibility.
                </span>
              </div>
            </header>

            {messagesLoading ? (
              <div className="empty-state">Decrypting conversation…</div>
            ) : (
              <div className="message-list" ref={listRef}>
                {messages.map((msg) => {
                  const isOutbound = msg.senderId === user.userId;
                  return (
                    <div
                      key={msg.id}
                      className={`message-item ${isOutbound ? 'outbound' : 'inbound'}`}
                    >
                      <span>{msg.body}</span>
                      <span className="timestamp">{formatTimestamp(msg.sentAt)}</span>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="empty-state">No messages yet. Say hello to start the thread.</div>
                )}
              </div>
            )}

            <form className="composer" onSubmit={handleSendMessage}>
              <textarea
                value={composerValue}
                onChange={(event) => setComposerValue(event.target.value)}
                placeholder="Draft a secure message…"
              />
              <button type="submit" className="primary-button">
                Send
              </button>
            </form>
            {(composerError || error) && <div className="error-banner">{composerError || error}</div>}
          </>
        ) : (
          <div className="empty-state">
            <div>
              <h2>Select someone to chat with</h2>
              <p>All encryption happens here. The server only relays your ciphertext.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

