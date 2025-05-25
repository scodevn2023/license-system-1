import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    const { prisma } = await import("@/lib/db")

    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      sessions,
    })
  } catch (error) {
    console.error("Get sessions error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
