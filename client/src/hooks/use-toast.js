import { toast as sonnerToast } from "sonner"

// Production-safe toast implementation using Sonner
export function toast({ title, description, variant = "default", ...props }) {
  // Handle different variants
  if (variant === "destructive") {
    sonnerToast.error(title || description, {
      description: title ? description : undefined,
      ...props
    })
  } else if (variant === "success") {
    sonnerToast.success(title || description, {
      description: title ? description : undefined,
      ...props
    })
  } else {
    sonnerToast(title || description, {
      description: title ? description : undefined,
      ...props
    })
  }

  return {
    id: Date.now().toString(),
    dismiss: () => sonnerToast.dismiss(),
    update: () => {} // No-op for compatibility
  }
}

// Production-safe useToast hook
export function useToast() {
  return {
    toast,
    dismiss: () => sonnerToast.dismiss(),
    toasts: [] // Empty array for compatibility
  }
}
