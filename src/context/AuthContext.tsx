import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from '../services/googleAuth';

interface AuthContextType {
  googleUser: User | null;
  isGoogleSigningIn: boolean;
  signInWithGoogleAccount: () => Promise<boolean>;
  signOutGoogleAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const signInWithGoogleAccount = async (): Promise<boolean> => {
    try {
      setIsGoogleSigningIn(true);
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Google Sign In error:', e);
      return false;
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const signOutGoogleAccount = async (): Promise<void> => {
    try {
      await logout();
      setGoogleUser(null);
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        googleUser,
        isGoogleSigningIn,
        signInWithGoogleAccount,
        signOutGoogleAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
