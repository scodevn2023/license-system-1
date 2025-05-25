import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function POST() {
  try {
    await requireAdmin()

    // Delete expired licenses
    const result = await prisma.license.deleteMany({
      where: {
        OR: [{ status: "EXPIRED" }, { expirationDate: { lt: new Date() } }],
      },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Đã xóa ${result.count} license hết hạn`,
    })
  } catch (error) {
    console.error("Cleanup expired licenses error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
