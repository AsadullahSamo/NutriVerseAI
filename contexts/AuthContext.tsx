import { createContext, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth, SignIn, SignUp } from '@clerk/nextjs';
import { SelectUser } from '@shared/schema';

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  signIn: typeof SignIn;
  signUp: typeof SignUp;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerkAuth();

  // Map Clerk user to your app's user type
  const mappedUser: SelectUser | null = user ? {
    id: parseInt(user.id),
    clerkId: user.id,
    preferences: user.publicMetadata.preferences || {},
  } : null;

  return (
    <AuthContext.Provider
      value={{
        user: mappedUser,
        isLoading: !isUserLoaded,
        signIn: SignIn,
        signUp: SignUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}