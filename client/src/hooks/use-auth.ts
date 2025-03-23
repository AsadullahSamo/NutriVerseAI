import React, { createContext, useContext, useState, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  forgotPasswordMutation: any;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user on component mount
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/user");
        if (!response.ok) return null;
        return response.json();
      } catch (error) {
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { 
      username: string; 
      password?: string;
      secretKey?: string;
    }) => {
      const response = await apiRequest("POST", "/api/login", credentials);
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
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout");
      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      window.location.href = "/auth";
    },
    onError: (err: any) => {
      setError(err.message);
      toast({
        title: "Logout failed",
        description: err.message,
        variant: "destructive",
      });
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
      const response = await apiRequest("POST", "/api/register", userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }
      const data = await response.json();
      return data;  // Return the full response which includes both user and secretKey
    },
    onSuccess: (data) => {
      setError(null);
      queryClient.setQueryData(["/api/user"], data.user);
    },
    onError: (err: any) => {
      setError(err.message);
      toast({
        title: "Registration failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const response = await apiRequest("PATCH", "/api/account/profile", profileData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Profile update failed");
      }
      return response.json();
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
      const response = await apiRequest("POST", "/api/account/change-password", passwordData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }
      return response.json();
    },
    onSuccess: () => {
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Add forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: { username: string; secretKey: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/account/change-password", data);
      return response.json();
    },
    onSuccess: () => {
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message);
      toast({
        title: "Password reset failed",
        description: err.message,
        variant: "destructive",
      });
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
        forgotPasswordMutation,
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