import { ClerkAPIError } from "@clerk/types";

export type AuthError = {
  code: string;
  message: string;
};

export function isClerkAPIError(error: unknown): error is ClerkAPIError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as ClerkAPIError).code === "string"
  );
}

export function handleAuthError(error: unknown): AuthError {
  if (isClerkAPIError(error)) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  return {
    code: "unknown_error",
    message: "An unknown authentication error occurred",
  };
}
