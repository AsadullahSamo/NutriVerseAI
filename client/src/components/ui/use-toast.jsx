import { toast as sonnerToast } from "sonner"

export function toast({ title, description, variant = "default" }) {
  if (variant === "destructive") {
    sonnerToast.error(title, { description })
  } else {
    sonnerToast.success(title, { description })
  }
}
