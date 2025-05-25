import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    const { prisma } = await import("@/lib/db")

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
  } catch (error) {
    console.error("Get licenses error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
