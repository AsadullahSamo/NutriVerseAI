import { QueryClient, QueryFunction } from "@tanstack/react-query";
import config from "./config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message;
    } catch {
      errorMessage = res.statusText;
    }

    // Handle specific error cases
    if (res.status === 401) {
      throw new Error("Please log in to perform this action");
    } else if (res.status === 403) {
      throw new Error("You don't have permission to perform this action");
    } else if (res.status === 404) {
      throw new Error("The requested resource was not found");
    } else if (res.status === 429) {
      throw new Error("Too many requests. Please try again later");
    } else {
      throw new Error(errorMessage || `${res.status}: Request failed`);
    }
  }
}

export async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
  customHeaders?: HeadersInit
) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    
    // Handle specific error cases
    if (response.status === 401) {
      throw new Error("Please log in to perform this action");
    } else if (response.status === 403) {
      throw new Error("You don't have permission to perform this action");
    } else if (response.status === 404) {
      throw new Error("The requested resource was not found");
    } else if (response.status === 429) {
      throw new Error("Too many requests. Please try again later");
    } else {
      throw new Error(error.message || response.statusText);
    }
  }

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(`${config.apiBaseUrl}${queryKey[0]}`, {
      credentials: "include",
      mode: "cors",
      headers: {
        "Accept": "application/json"
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
