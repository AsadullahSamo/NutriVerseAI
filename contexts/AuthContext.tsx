import { createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useUserPreferences } from './UserPreferencesContext';

interface AuthContextType {
  user: {
    id: string;
    username: string;
    email?: string;
    name?: string;
    profilePicture?: string;
  } | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user } = useUser();
  const { resetPreferences } = useUserPreferences();

  const enhancedSignOut = async () => {
    await signOut();
    resetPreferences();
    localStorage.removeItem('userPreferences');
  };

  const value = {
    user: user ? {
      id: user.id,
      username: user.username || user.primaryEmailAddress?.emailAddress || 'User',
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName,
      profilePicture: user.imageUrl,
    } : null,
    isLoading: !isLoaded,
    isSignedIn: !!isSignedIn,
    signOut: enhancedSignOut,
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