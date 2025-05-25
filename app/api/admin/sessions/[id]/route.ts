import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const sessionId = params.id

    const { prisma } = await import("@/lib/db")

    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
    })

    if (!existingSession) {
      return NextResponse.json({ error: "Session không tồn tại" }, { status: 404 })
    }

    // Delete session
    await prisma.session.delete({
      where: { id: sessionId },
    })

    return NextResponse.json({
      success: true,
      message: "Session đã được thu hồi thành công",
    })
  } catch (error) {
    console.error("Delete session error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
