import { useCallback } from "react"

type ToastProps = {
  title: string
  description?: string
  variant?: "default" | "destructive" | "success" // Extend as needed
}

// You can later replace this with a real toast system like Sonner, Radix, etc.
function showToast({ title, description, variant = "default" }: ToastProps) {
  // Replace this with your real toast logic or external toast system.
  console.log(`[${variant.toUpperCase()}] ${title}: ${description}`)
}

export function useToast() {
  const toast = useCallback((props: ToastProps) => {
    showToast(props)
  }, [])

  return { toast }
}
