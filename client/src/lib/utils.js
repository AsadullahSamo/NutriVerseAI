import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import config from "./config";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export async function apiRequest(method, path, body) {
  const fullUrl = path.startsWith('http') ? path : `${config.apiBaseUrl}${path}`;
  const response = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(response.statusText);
  if (response.status === 204) return null;
  return response.json();
}
