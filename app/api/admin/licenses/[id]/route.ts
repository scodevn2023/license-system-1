import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const { key, type, status, userId, expirationDate, notes, hardwareId } = await request.json()
    const licenseId = params.id

    if (!key || !type || !userId || !expirationDate) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 })
    }

    const { prisma } = await import("@/lib/db")

    // Check if license exists
    const existingLicense = await prisma.license.findUnique({
      where: { id: licenseId },
    })

    if (!existingLicense) {
      return NextResponse.json({ error: "License không tồn tại" }, { status: 404 })
    }

    // Check if license key is already used by another license
    const keyLicense = await prisma.license.findUnique({
      where: { key },
    })

    if (keyLicense && keyLicense.id !== licenseId) {
      return NextResponse.json({ error: "License key này đã được sử dụng" }, { status: 409 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User không tồn tại" }, { status: 404 })
    }

    // Update license
    const license = await prisma.license.update({
      where: { id: licenseId },
      data: {
        key,
        type,
        status,
        userId,
        expirationDate: new Date(expirationDate),
        notes: notes || null,
        hardwareId: hardwareId || null,
        // Update activatedAt if status changes to ACTIVE
        activatedAt:
          status === "ACTIVE" && existingLicense.status !== "ACTIVE" ? new Date() : existingLicense.activatedAt,
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
    console.error("Update license error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const licenseId = params.id

    const { prisma } = await import("@/lib/db")

    // Check if license exists
    const existingLicense = await prisma.license.findUnique({
      where: { id: licenseId },
    })

    if (!existingLicense) {
      return NextResponse.json({ error: "License không tồn tại" }, { status: 404 })
    }

    // Delete license
    await prisma.license.delete({
      where: { id: licenseId },
    })

    return NextResponse.json({
      success: true,
      message: "License đã được xóa thành công",
    })
  } catch (error) {
    console.error("Delete license error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
