    import { cookies } from "next/headers"
    import { prisma } from "./prisma"
    import bcrypt from "bcryptjs"
    import jwt from "jsonwebtoken"

    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

    export interface User {
      id: string
      email: string
      username: string
      name?: string
      avatar?: string
      reputation: number
      isAdmin: boolean
    }

    export async function hashPassword(password: string): Promise<string> {
      return bcrypt.hash(password, 12)
    }

    export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
      return bcrypt.compare(password, hashedPassword)
    }

    export function generateToken(user: User): string {
      return jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          isAdmin: user.isAdmin,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      )
    }

    export function verifyToken(token: string): any {
      try {
        return jwt.verify(token, JWT_SECRET)
      } catch {
        return null
      }
    }

    export async function getCurrentUser(): Promise<User | null> {
      try {
        const cookieStore = cookies()
        const token = (await cookieStore).get("auth-token")?.value

        if (!token) return null

        const payload = verifyToken(token)
        if (!payload) return null

        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar: true,
            reputation: true,
            isAdmin: true,
          },
        })

        return user
      } catch {
        return null
      }
    }

    export function setAuthCookie(token: string) {
      const cookieStore = cookies()
      cookieStore.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    export function clearAuthCookie() {
      const cookieStore = cookies()
      cookieStore.delete("auth-token")
    }
