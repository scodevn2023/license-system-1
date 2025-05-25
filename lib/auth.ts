import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret"

export interface AuthUser {
  id: string
  email: string
  role: string
  name?: string
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded
  } catch (error) {
    return null
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" })
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized - Admin access required")
  }
  return user
}
