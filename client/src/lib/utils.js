import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export async function apiRequest(method, path, body) {
    const response = await fetch(path, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok)
        throw new Error(response.statusText);
    if (response.status === 204)
        return null;
    return response.json();
}
