import React, { createContext, useContext, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/queryClient"
import { useLocation } from "wouter"
import { toast } from "sonner"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [error, setError] = useState(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [, setLocation] = useLocation()

  // Fetch user on component mount
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/user")
        if (!response.ok) return null
        return response.json()
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          return null
        }
        return null
      }
    },
    retry: false,
    refetchOnWindowFocus: true
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await apiRequest("POST", "/api/login", credentials);

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 401) {
          if (error.message.includes("User does not exist")) {
            throw new Error("User does not exist. Please register an account.")
          } else if (error.message.includes("Incorrect password")) {
            throw new Error("Incorrect password. Please try again.")
          }
          throw new Error(error.message || "Invalid credentials")
        }
        throw new Error(error.message || "Failed to login")
      }

      const data = await response.json()
      return data
    },
    onSuccess: (data) => {
      setError(null)

      // Store token for cross-domain authentication
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      queryClient.setQueryData(["/api/user"], data)
      queryClient.invalidateQueries({ queryKey: ["/api/user"] })
    },
    onError: (error) => {
      setError(error.message)
      throw error
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/logout");
      if (!response.ok) {
        throw new Error("Failed to logout")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null)
      queryClient.clear()
      toast("Successfully logged out!", {
        duration: 3000,
        style: {
          background: "#4CAF50",
          color: "white",
        },
      })
    },
    onError: (error) => {
      setError(error.message)
      toast(error.message, {
        duration: 3000,
        style: {
          background: "#f44336",
          color: "white",
        },
      })
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async userData => {
      const response = await apiRequest("POST", "/api/register", userData)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Registration failed")
      }
      const data = await response.json()
      return data // Return the full response which includes both user and secretKey
    },
    onSuccess: data => {
      setError(null)
      queryClient.setQueryData(["/api/user"], data.user)
    },
    onError: err => {
      setError(err.message)
      toast({
        title: "Registration failed",
        description: err.message,
        variant: "destructive"
      })
    }
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async profileData => {
      const response = await apiRequest(
        "PATCH",
        "/api/account/profile",
        profileData
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Profile update failed")
      }
      return response.json()
    },
    onSuccess: data => {
      setError(null)
      queryClient.setQueryData(["/api/user"], data)
      queryClient.invalidateQueries({ queryKey: ["/api/user"] })
    },
    onError: err => {
      setError(err.message)
    }
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async passwordData => {
      const response = await apiRequest(
        "POST",
        "/api/account/change-password",
        passwordData
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to change password")
      }
      return response.json()
    },
    onSuccess: () => {
      setError(null)
    },
    onError: err => {
      setError(err.message)
    }
  })

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async passwordData => {
      const response = await apiRequest(
        "POST",
        "/api/account/delete",
        passwordData
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete account")
      }
      return response.json()
    },
    onSuccess: () => {
      setError(null)
      // Clear local data
      localStorage.removeItem("userProfile")
      localStorage.removeItem("userPreferences")
      // Redirect to auth page
      window.location.href = "/auth"
    },
    onError: err => {
      setError(err.message)
      toast({
        title: "Delete account failed",
        description: err.message,
        variant: "destructive"
      })
    }
  })

  // Add forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async data => {
      const response = await apiRequest(
        "POST",
        "/api/account/change-password",
        data
      )
      return response.json()
    },
    onSuccess: () => {
      setError(null)
    },
    onError: err => {
      setError(err.message)
      toast({
        title: "Password reset failed",
        description: err.message,
        variant: "destructive"
      })
    }
  })

  // Had to change the JSX format to fix compilation issue
  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user: user ?? null,
        isAuthenticated: !!user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        updateProfileMutation,
        changePasswordMutation,
        forgotPasswordMutation,
        deleteAccountMutation
      }
    },
    children
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
