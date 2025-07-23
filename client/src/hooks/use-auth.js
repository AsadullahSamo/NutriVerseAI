import React, { createContext, useContext, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useLocation } from "wouter"
import { toast } from "sonner"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [error, setError] = useState(null)
  const queryClient = useQueryClient()
  const [, setLocation] = useLocation()

  // Fetch user on component mount
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const userData = await apiRequest("GET", "/api/user")
        console.log("User query result:", userData)
        return userData
      } catch (error) {
        console.log("User query error:", error.message)
        if (error instanceof Error && (error.message.includes("401") || error.message.includes("Authentication required"))) {
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
      try {
        const data = await apiRequest("POST", "/api/login", credentials)
        console.log("Login successful, data:", data)
        return data
      } catch (error) {
        console.error("Login error:", error)
        if (error.message.includes("User does not exist")) {
          throw new Error("User does not exist. Please register an account.")
        } else if (error.message.includes("Incorrect password")) {
          throw new Error("Incorrect password. Please try again.")
        }
        throw error
      }
    },
    onSuccess: (data) => {
      setError(null)

      // Store token for cross-domain authentication
      console.log('Login response data:', data);
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        console.log('Token stored in localStorage:', data.token);
      } else {
        console.log('No token in login response');
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
      try {
        const result = await apiRequest("POST", "/api/logout")
        return result
      } catch (error) {
        // Even if logout fails on server, we should clear local state
        console.warn("Server logout failed, but clearing local state:", error)
        return null
      }
    },
    onSuccess: () => {
      // Clear all query cache and user data
      queryClient.setQueryData(["/api/user"], null)
      queryClient.clear()

      // Clear localStorage including auth token
      localStorage.removeItem("authToken")
      localStorage.removeItem("userProfile")
      localStorage.removeItem("userPreferences")

      // Force page reload to ensure clean state
      window.location.href = "/auth"
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
      toast.error("Registration failed", {
        description: err.message
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
      try {
        console.log("Delete account request - passwordData:", passwordData)
        console.log("Current auth token:", localStorage.getItem('authToken'))
        const result = await apiRequest(
          "POST",
          "/api/account/delete",
          passwordData
        )
        console.log("Delete account success:", result)
        return result
      } catch (error) {
        console.error("Delete account error:", error)
        throw error
      }
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
      toast.error("Delete account failed", {
        description: err.message
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
      toast.error("Password reset failed", {
        description: err.message
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
