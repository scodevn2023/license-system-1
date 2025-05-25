import { type NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (user) {
      try {
        // Delete session from database
        const token = request.cookies.get("token")?.value
        if (token) {
          await prisma.session.deleteMany({
            where: { token },
          })
        }
      } catch (dbError) {
        console.error("Database error during logout:", dbError)
        // Continue with logout even if DB operation fails
      }
    }

    // Clear cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete("token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
