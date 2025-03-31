import React, { createContext, useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [error, setError] = useState(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    // Fetch user on component mount
    const { data: user, isLoading } = useQuery({
        queryKey: ["/api/user"],
        queryFn: async () => {
            try {
                const response = await apiRequest("GET", "/api/user");
                if (!response.ok)
                    return null;
                return response.json();
            }
            catch (error) {
                return null;
            }
        },
        retry: false,
        refetchOnWindowFocus: true,
    });
    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async (credentials) => {
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
        onError: (err) => {
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
        onError: (err) => {
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
        mutationFn: async (userData) => {
            const response = await apiRequest("POST", "/api/register", userData);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Registration failed");
            }
            const data = await response.json();
            return data; // Return the full response which includes both user and secretKey
        },
        onSuccess: (data) => {
            setError(null);
            queryClient.setQueryData(["/api/user"], data.user);
        },
        onError: (err) => {
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
        mutationFn: async (profileData) => {
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
        onError: (err) => {
            setError(err.message);
        },
    });
    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: async (passwordData) => {
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
        onError: (err) => {
            setError(err.message);
        },
    });
    // Add forgot password mutation
    const forgotPasswordMutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiRequest("POST", "/api/account/change-password", data);
            return response.json();
        },
        onSuccess: () => {
            setError(null);
        },
        onError: (err) => {
            setError(err.message);
            toast({
                title: "Password reset failed",
                description: err.message,
                variant: "destructive",
            });
        },
    });
    // Had to change the JSX format to fix compilation issue
    return React.createElement(AuthContext.Provider, {
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
    }, children);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
