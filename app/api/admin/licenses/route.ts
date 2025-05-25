import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()

    const { key, type, userId, expirationDate, notes } = await request.json()

    if (!key || !type || !userId || !expirationDate) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 })
    }

    // Check if license key already exists
    const existingLicense = await prisma.license.findUnique({
      where: { key },
    })

    if (existingLicense) {
      return NextResponse.json({ error: "License key này đã tồn tại" }, { status: 409 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User không tồn tại" }, { status: 404 })
    }

    // Create license
    const license = await prisma.license.create({
      data: {
        key,
        type,
        userId,
        creatorId: admin.id,
        expirationDate: new Date(expirationDate),
        notes: notes || null,
        status: "PENDING",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      license,
    })
  } catch (error) {
    console.error("Create license error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
