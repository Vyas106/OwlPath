"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: string
  email: string
  username: string
  name?: string
  avatar?: string
  bio?: string
  reputation: number
  isAdmin: boolean
  createdAt?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  login: (email: string, password: string) => Promise<boolean>
  register: (data: any) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          })

          if (response.ok) {
            const data = await response.json()
            set({ user: data.user, isLoading: false })
            return true
          }
          set({ isLoading: false })
          return false
        } catch {
          set({ isLoading: false })
          return false
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          })

          if (response.ok) {
            // Auto-login after registration
            const loginSuccess = await get().login(userData.email, userData.password)
            set({ isLoading: false })
            return loginSuccess
          }
          set({ isLoading: false })
          return false
        } catch {
          set({ isLoading: false })
          return false
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" })
        } catch (error) {
          console.error("Logout error:", error)
        }
        set({ user: null })
      },

      checkAuth: async () => {
        if (get().isInitialized) return

        set({ isLoading: true })
        try {
          const response = await fetch("/api/auth/me")
          if (response.ok) {
            const data = await response.json()
            set({ user: data.user })
          } else {
            set({ user: null })
          }
        } catch (error) {
          console.error("Auth check error:", error)
          set({ user: null })
        } finally {
          set({ isLoading: false, isInitialized: true })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
