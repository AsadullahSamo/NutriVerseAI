import React, { createContext, useContext, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useLocation } from "wouter"
import { toast } from "sonner"
import config from "@/lib/config"

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
      console.log("Starting login with credentials:", { username: credentials.username })

      const response = await fetch(`${config.apiBaseUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(credentials),
        credentials: "include"
      })

      console.log("Login response status:", response.status)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error("Login failed with error:", error)

        if (response.status === 401) {
          if (error.message && error.message.includes("User does not exist")) {
            throw new Error("User does not exist. Please register an account.")
          } else if (error.message && error.message.includes("Incorrect password")) {
            throw new Error("Incorrect password. Please try again.")
          }
          throw new Error(error.message || "Invalid credentials")
        }
        throw new Error(error.message || "Failed to login")
      }

      const data = await response.json()
      console.log("Login successful, received data:", data)
      return data
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
      console.log("Starting registration with userData:", { username: userData.username, email: userData.email })

      const response = await fetch(`${config.apiBaseUrl}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userData),
        credentials: "include"
      })

      console.log("Registration response status:", response.status)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error("Registration failed with error:", error)
        throw new Error(error.message || "Registration failed")
      }

      const data = await response.json()
      console.log("Registration successful, received data:", data)
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
      try {
        console.log("Update profile request - profileData:", profileData)
        const token = localStorage.getItem('authToken')
        console.log("Current auth token:", token)

        const response = await fetch(`${config.apiBaseUrl}/api/account/profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify(profileData),
          credentials: "include"
        })

        console.log("Update profile response status:", response.status)

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          console.error("Update profile failed with error:", error)
          throw new Error(error.message || "Profile update failed")
        }

        const result = await response.json()
        console.log("Update profile success:", result)
        return result
      } catch (error) {
        console.error("Update profile error:", error)
        throw error
      }
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
      try {
        console.log("Change password request")
        const token = localStorage.getItem('authToken')
        console.log("Current auth token:", token)

        const response = await fetch(`${config.apiBaseUrl}/api/account/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify(passwordData),
          credentials: "include"
        })

        console.log("Change password response status:", response.status)

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          console.error("Change password failed with error:", error)
          throw new Error(error.message || "Failed to change password")
        }

        const result = await response.json()
        console.log("Change password success:", result)
        return result
      } catch (error) {
        console.error("Change password error:", error)
        throw error
      }
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
        const token = localStorage.getItem('authToken')
        console.log("Current auth token:", token)

        const response = await fetch(`${config.apiBaseUrl}/api/account/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify(passwordData),
          credentials: "include"
        })

        console.log("Delete account response status:", response.status)

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          console.error("Delete account failed with error:", error)
          throw new Error(error.message || "Failed to delete account")
        }

        const result = await response.json()
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
