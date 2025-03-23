import React, { createContext, useContext, useState, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type User = {
  id: number;
  username: string;
  email?: string;
  name?: string;
  bio?: string;
  profilePicture?: string;
  preferences?: Record<string, any>;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
  updateProfileMutation: any;
  changePasswordMutation: any;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch user on component mount
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setError(null);
      queryClient.setQueryData(["/api/user"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Logout failed");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      window.location.href = "/auth";
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: {
      username: string;
      password: string;
      email?: string;
      name?: string;
    }) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setError(null);
      queryClient.setQueryData(["/api/user"], data);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Profile update failed");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setError(null);
      queryClient.setQueryData(["/api/user"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      return await response.json();
    },
    onSuccess: () => {
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Had to change the JSX format to fix compilation issue
  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
        changePasswordMutation,
      }
    },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}