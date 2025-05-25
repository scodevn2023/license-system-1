import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireAdmin()

    try {
      const users = await prisma.user.findMany({
        include: {
          licenses: {
            include: {
              creator: {
                select: { name: true, email: true },
              },
            },
          },
          _count: {
            select: {
              licenses: true,
              createdLicenses: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })

      return NextResponse.json({
        success: true,
        users,
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Lỗi cơ sở dữ liệu" }, { status: 500 })
    }
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
