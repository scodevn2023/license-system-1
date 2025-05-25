import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    // Dynamic import of Prisma
    const { PrismaClient } = await import("@prisma/client")
    const prisma = new PrismaClient()

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
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
