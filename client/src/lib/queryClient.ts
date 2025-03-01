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
    throw new Error(errorMessage || `${res.status}: Request failed`);
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
    credentials: "include", // Add this line to include credentials
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || response.statusText);
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
