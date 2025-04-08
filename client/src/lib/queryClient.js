import { QueryClient } from "@tanstack/react-query"
import config from "./config"

async function throwIfResNotOk(res) {
  if (!res.ok) {
    let errorMessage
    try {
      const errorData = await res.json()
      errorMessage = errorData.message
    } catch {
      errorMessage = res.statusText
    }

    // Handle specific error cases
    if (res.status === 401) {
      // Use the server's error message if available, otherwise provide a more specific message
      throw new Error(errorMessage || "Authentication required. Please log in to continue.")
    } else if (res.status === 403) {
      throw new Error("You don't have permission to perform this action")
    } else if (res.status === 404) {
      throw new Error("The username is incorrect")
    } else if (res.status === 429) {
      throw new Error("Too many requests. Please try again later")
    } else {
      throw new Error(errorMessage || `${res.status}: Request failed`)
    }
  }
}

export async function apiRequest(method, path, body, customHeaders) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    // Handle specific error cases
    if (response.status === 401) {
      // Use the server's error message if available, otherwise provide a more specific message
      throw new Error(error.message || "Authentication required. Please log in to continue.")
    } else if (response.status === 403) {
      throw new Error("You don't have permission to perform this action")
    } else if (response.status === 404) {
      throw new Error("The user does not exist")
    } else if (response.status === 429) {
      throw new Error("Too many requests. Please try again later")
    } else {
      throw new Error(error.message || response.statusText)
    }
  }

  return response
}

export const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({
  queryKey
}) => {
  const res = await fetch(`${config.apiBaseUrl}${queryKey[0]}`, {
    credentials: "include",
    mode: "cors",
    headers: {
      Accept: "application/json"
    }
  })

  if (unauthorizedBehavior === "returnNull" && res.status === 401) {
    return null
  }

  await throwIfResNotOk(res)
  return await res.json()
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
})
