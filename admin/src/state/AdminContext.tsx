import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import nacl from 'tweetnacl';
import { fetchAdminMessages, getAdminSocketUrl } from '../api';
import { decodeBase64 } from '@shared/crypto';
import type { AdminMessage } from '../types';

interface AdminContextValue {
  token: string | null;
  adminSecretKey: Uint8Array | null;
  messages: AdminMessage[];
  selectedUserId: string | null;
  selectedPeerId: string | null;
  isLoading: boolean;
  error: string | null;
  login: (token: string) => void;
  logout: () => void;
  setAdminSecretKeyFromBase64: (secretKeyBase64: string) => void;
  selectConversation: (userId: string, peerId: string) => void;
  refreshMessages: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [adminSecretKey, setAdminSecretKey] = useState<Uint8Array | null>(null);

  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const teardownSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const connectSocket = useCallback(
    (adminToken: string) => {
      teardownSocket();
      const socket = io(getAdminSocketUrl(adminToken), {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        socket.emit('admin:join', adminToken);
      });

      socket.on('message:new', (record: AdminMessage) => {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.messageId === record.messageId);
          if (exists) return prev;
          return [...prev, record];
        });
      });

      socket.on('connect_error', (err) => {
        console.error('Admin socket connection error:', err);
        setError('Failed to connect to realtime channel.');
      });

      socket.on('disconnect', () => {
        // silent disconnect; UI remains available with cached data
      });

      socketRef.current = socket;
    },
    [teardownSocket]
  );

  const logout = useCallback(() => {
    setToken(null);
    setAdminSecretKey(null);
    setMessages([]);
    setSelectedUserId(null);
    setSelectedPeerId(null);
    setError(null);
    teardownSocket();
  }, [teardownSocket]);

  const login = useCallback(
    (adminToken: string) => {
      setToken(adminToken);
      setError(null);
      connectSocket(adminToken);
    },
    [connectSocket]
  );

  const setAdminSecretKeyFromBase64 = useCallback((secretKeyBase64: string) => {
    try {
      const decoded = decodeBase64(secretKeyBase64.trim());
      if (decoded.length !== nacl.box.secretKeyLength) {
        throw new Error('Invalid secret key length.');
      }
      setAdminSecretKey(decoded);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid secret key.';
      setError(message);
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAdminMessages(token);
      setMessages(result.messages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch messages.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshMessages();
    }
  }, [refreshMessages, token]);

  const selectConversation = useCallback((userId: string, peerId: string) => {
    const [first, second] = [userId, peerId].sort();
    setSelectedUserId(first);
    setSelectedPeerId(second);
  }, []);

  useEffect(() => {
    return () => {
      teardownSocket();
    };
  }, [teardownSocket]);

  const value = useMemo<AdminContextValue>(
    () => ({
      token,
      adminSecretKey,
      messages,
      selectedUserId,
      selectedPeerId,
      isLoading,
      error,
      login,
      logout,
      setAdminSecretKeyFromBase64,
      selectConversation,
      refreshMessages,
    }),
    [
      adminSecretKey,
      error,
      isLoading,
      login,
      logout,
      messages,
      refreshMessages,
      selectedPeerId,
      selectedUserId,
      selectConversation,
      token,
      setAdminSecretKeyFromBase64,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within AdminProvider');
  }
  return context;
}

