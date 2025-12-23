import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage, isAuthError } from '@/lib/error-handler';

interface User {
  id: number;
  email: string;
  fullName: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!token;

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setError(null);
    try {
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (e) {
      // Ignore localStorage errors (SSR, private browsing, etc.)
    }
    apiClient.setToken(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    } catch (e) {
      // Ignore localStorage errors
    }
    apiClient.setToken(null);
  };

  const clearError = () => {
    setError(null);
  };

  const refreshUser = async () => {
    let storedToken: string | null = null;
    try {
      storedToken = localStorage.getItem('auth_token');
    } catch (e) {
      setIsLoading(false);
      return;
    }

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      apiClient.setToken(storedToken);
      const data = await apiClient.getCurrentUser();
      setToken(storedToken);
      setUser(data.user);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      const errorMessage = getErrorMessage(err);
      
      if (isAuthError(err)) {
        // Token is invalid, clear auth state
        logout();
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for stored authentication on client side
    let storedToken: string | null = null;
    let storedUser: string | null = null;
    
    try {
      storedToken = localStorage.getItem('auth_token');
      storedUser = localStorage.getItem('user');
    } catch (e) {
      // localStorage not available (SSR, private browsing, etc.)
      setIsLoading(false);
      return;
    }

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        apiClient.setToken(storedToken);
        // Optionally refresh user data from server
        refreshUser();
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}