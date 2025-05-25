import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    const { prisma } = await import("@/lib/db")

    const [totalUsers, totalLicenses, activeLicenses, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.license.count(),
      prisma.license.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      stats: { totalUsers, totalLicenses, activeLicenses, recentUsers },
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
