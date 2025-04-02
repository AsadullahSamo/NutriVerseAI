import { createContext, useContext } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiRequest, queryClient } from "../lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { useLocation } from "wouter"

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { toast } = useToast()
  const [, setLocation] = useLocation()

  const { data: user, error, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user")
        return res.json()
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          return null
        }
        throw error
      }
    }
  })

  const loginMutation = useMutation({
    mutationFn: async credentials => {
      const res = await apiRequest("POST", "/api/login", credentials)
      const data = await res.json()
      return data
    },
    onSuccess: user => {
      queryClient.setQueryData(["/api/user"], user)
    },
    onError: error => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const registerMutation = useMutation({
    mutationFn: async credentials => {
      const res = await apiRequest("POST", "/api/register", credentials)
      const data = await res.json()
      return data
    },
    onSuccess: user => {
      queryClient.setQueryData(["/api/user"], user)
    },
    onError: error => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout")
      if (!res.ok) {
        throw new Error("Logout failed")
      }
    },
    onSuccess: () => {
      // First clear the user state
      queryClient.setQueryData(["/api/user"], null)
      // Then clear all queries in the cache
      queryClient.clear()
      // Force a navigation to auth page
      window.location.href = "/auth"
    },
    onError: error => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
