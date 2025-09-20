import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUser } from '@/lib/auth';

interface User {
  id: number;
  name: string;
  email: string;
  exam_type: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getUser(token)
        .then((data) => {
          setUser(data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    const data = await getUser(token);
    setUser(data);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
