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
import type { ApiUser, AuthPayload } from '../types';
import {
  registerUser as registerUserApi,
  loginUser as loginUserApi,
  fetchAdminConfig,
  getSocketUrl,
} from '../services/api';
import {
  decryptPrivateKey,
  encryptPrivateKey,
  generateUserKeyPair,
  encodeBase64,
} from '../services/crypto';

interface AuthContextValue {
  user: ApiUser | null;
  token: string | null;
  secretKey: Uint8Array | null;
  adminPublicKey: string | null;
  isLoading: boolean;
  error: string | null;
  socket: Socket | null;
  register: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<Uint8Array | null>(null);
  const [adminPublicKey, setAdminPublicKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const teardownSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const initSocket = useCallback(
    (authToken: string) => {
      teardownSocket();
      const socket = io(getSocketUrl(), {
        autoConnect: true,
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        socket.emit('auth:join', authToken);
      });

      socket.on('disconnect', () => {
        // no-op; logs handled server-side
      });

      socketRef.current = socket;
    },
    [teardownSocket]
  );

  const clearState = useCallback(() => {
    setUser(null);
    setToken(null);
    setSecretKey(null);
    setAdminPublicKey(null);
    setError(null);
    teardownSocket();
  }, [teardownSocket]);

  const register = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const trimmedUsername = username.trim();
      if (!trimmedUsername || !password) {
        throw new Error('Username and password are required.');
      }

      const keyPair = generateUserKeyPair();
      const { encoded } = await encryptPrivateKey(keyPair.secretKey, password);
      await registerUserApi({
        username: trimmedUsername,
        password,
        publicKey: encodeBase64(keyPair.publicKey),
        encryptedPrivateKey: encoded,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const finalizeLogin = useCallback(
    async (payload: AuthPayload, password: string) => {
      const privateKey = await decryptPrivateKey(payload.encryptedPrivateKey, password);
      if (!privateKey) {
        throw new Error('Unable to unlock your private key. Check your password.');
      }

      const adminConfig = await fetchAdminConfig();

      const authenticatedUser: ApiUser = {
        userId: payload.userId,
        username: payload.username,
        publicKey: payload.publicKey,
      };

      setUser(authenticatedUser);
      setToken(payload.token);
      setSecretKey(privateKey);
      setAdminPublicKey(adminConfig.adminPublicKey);

      initSocket(payload.token);
    },
    [initSocket]
  );

  const login = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const payload = await loginUserApi({ username, password });
        await finalizeLogin(payload, password);
      } catch (err) {
        clearState();
        const message = err instanceof Error ? err.message : 'Login failed.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [clearState, finalizeLogin]
  );

  const logout = useCallback(() => {
    clearState();
  }, [clearState]);

  useEffect(() => {
    return () => {
      teardownSocket();
    };
  }, [teardownSocket]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      secretKey,
      adminPublicKey,
      isLoading,
      error,
      socket: socketRef.current,
      register,
      login,
      logout,
    }),
    [adminPublicKey, error, isLoading, login, logout, register, secretKey, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}

export function useAuth() {
  return useAuthContext();
}

export function useSocket(): Socket | null {
  const { socket } = useAuthContext();
  return socket;
}

export function useIsAuthenticated(): boolean {
  const { token } = useAuthContext();
  return Boolean(token);
}


