import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST() {
  try {
    await requireAdmin()

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
  } catch (error) {
    console.error("Cleanup expired sessions error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
