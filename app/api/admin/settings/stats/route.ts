import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    await requireAdmin()

    const [totalUsers, totalLicenses, activeLicenses, expiredLicenses, totalSessions, activeSessions] =
      await Promise.all([
        prisma.user.count(),
        prisma.license.count(),
        prisma.license.count({ where: { status: "ACTIVE" } }),
        prisma.license.count({
          where: {
            OR: [{ status: "EXPIRED" }, { expirationDate: { lt: new Date() } }],
          },
        }),
        prisma.session.count(),
        prisma.session.count({
          where: {
            expiresAt: { gt: new Date() },
          },
        }),
      ])

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        totalSessions,
        activeSessions,
      },
    })
  } catch (error) {
    console.error("Get settings stats error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
