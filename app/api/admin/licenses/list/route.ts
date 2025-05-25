import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    // Dynamic import of Prisma
    const { PrismaClient } = await import("@prisma/client")
    const prisma = new PrismaClient()

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
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error("Get licenses error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
