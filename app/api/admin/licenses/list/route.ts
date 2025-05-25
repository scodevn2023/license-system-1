import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireAdmin()

    try {
      const licenses = await prisma.license.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { name: true, email: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json({
        success: true,
        licenses,
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Lỗi cơ sở dữ liệu" }, { status: 500 })
    }
  } catch (error) {
    console.error("Get licenses error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
