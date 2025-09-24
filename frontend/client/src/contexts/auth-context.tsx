import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUser } from '@/lib/auth';

/**
 * @interface User
 * Represents the structure of a user object.
 * @property {number} id - The unique identifier for the user.
 * @property {string} name - The user's full name.
 * @property {string} email - The user's email address.
 * @property {string} exam_type - The type of exam the user is preparing for.
 */
interface User {
  id: number;
  name: string;
  email: string;
  exam_type: string;
}

/**
 * @interface AuthContextType
 * Defines the shape of the authentication context.
 * @property {boolean} isAuthenticated - True if the user is authenticated.
 * @property {User | null} user - The authenticated user's data, or null if not logged in.
 * @property {(token: string) => void} login - Function to handle user login.
 * @property {() => void} logout - Function to handle user logout.
 */
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access the authentication context.
 *
 * This hook provides an easy way to access the authentication state and
 * methods (`isAuthenticated`, `user`, `login`, `logout`) from any component
 * wrapped in an `AuthProvider`.
 *
 * @returns {AuthContextType} The authentication context.
 * @throws {Error} If used outside of an `AuthProvider`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * @interface AuthProviderProps
 * @property {ReactNode} children - The child components to be wrapped by the provider.
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication state and actions to its children.
 *
 * This component manages the user's authentication status, stores the auth
 * token, and provides login and logout functions. It checks for an existing
 * token in local storage on initial render to maintain session persistence.
 *
 * @param {AuthProviderProps} props - The props for the component.
 * @returns {JSX.Element} The authentication provider component.
 */
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
