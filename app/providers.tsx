'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { User, AuthContextType, MOCK_USERS } from '@/lib/auth';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userRecord = MOCK_USERS[email];
    if (!userRecord || userRecord.password !== password) {
      throw new Error('Invalid email or password');
    }

    setUser(userRecord.user);
    localStorage.setItem('user', JSON.stringify(userRecord.user));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </ConvexProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
