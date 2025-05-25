import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function POST() {
  try {
    await requireAdmin()

    // Dynamic import of Prisma
    const { PrismaClient } = await import("@prisma/client")
    const prisma = new PrismaClient()

    try {
      // Delete expired sessions
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      })

      return NextResponse.json({
        success: true,
        deletedCount: result.count,
        message: `Đã xóa ${result.count} session hết hạn`,
      })
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error("Cleanup expired sessions error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
