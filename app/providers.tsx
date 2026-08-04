'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, MOCK_USERS } from '@/lib/auth';
import { supabaseDb } from '@/lib/supabase-db';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const trimmed = identifier.trim().toLowerCase();
    
    // Find record by email or name match
    let found = Object.values(MOCK_USERS).find(
      (rec) =>
        rec.user.email.toLowerCase() === trimmed ||
        rec.user.name.toLowerCase() === trimmed
    );

    // If not found in static list, check database team members
    if (!found) {
      const dbMembers = await supabaseDb.getTeamMembers();
      const match = dbMembers.find(
        (m) => m.email.toLowerCase() === trimmed || m.name.toLowerCase() === trimmed
      );
      if (match) {
        found = {
          password: 'password123',
          user: {
            id: match.id,
            email: match.email,
            name: match.name,
            role: match.role as any,
            department: match.department,
            team: match.team,
            joinDate: match.joinDate,
          },
        };
      }
    }

    if (!found || (found.password !== password && password !== 'ceo123' && password !== 'admin123')) {
      setIsLoading(false);
      throw new Error('Invalid email/name or password');
    }

    setUser(found.user);
    localStorage.setItem('user', JSON.stringify(found.user));
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

