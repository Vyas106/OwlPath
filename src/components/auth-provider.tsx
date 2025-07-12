"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "@/lib/client-auth"
import { useRouter, usePathname } from "next/navigation"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, user, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isInitialized && user && (pathname === "/auth/login" || pathname === "/auth/register")) {
      router.push("/questions")
    }
  }, [isInitialized, user, pathname, router])

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}
