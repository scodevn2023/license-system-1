import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { email, password, name, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email và password là bắt buộc" }, { status: 400 })
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 409 })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          role: role || "USER",
        },
      })

      const { password: _, ...userWithoutPassword } = user

      return NextResponse.json({
        success: true,
        user: userWithoutPassword,
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Lỗi cơ sở dữ liệu" }, { status: 500 })
    }
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
