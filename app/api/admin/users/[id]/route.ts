import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const { email, password, name, role } = await request.json()
    const userId = params.id

    if (!email) {
      return NextResponse.json({ error: "Email là bắt buộc" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User không tồn tại" }, { status: 404 })
    }

    // Check if email is already used by another user
    const emailUser = await prisma.user.findUnique({
      where: { email },
    })

    if (emailUser && emailUser.id !== userId) {
      return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 409 })
    }

    // Prepare update data
    const updateData: any = {
      email,
      name: name || null,
      role: role || "USER",
    }

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()

    const userId = params.id

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        licenses: true,
        createdLicenses: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User không tồn tại" }, { status: 404 })
    }

    // Delete user (this will cascade delete sessions due to onDelete: Cascade)
    // But we need to handle licenses manually
    await prisma.$transaction(async (tx) => {
      // Delete licenses owned by this user
      await tx.license.deleteMany({
        where: { userId: userId },
      })

      // Update licenses created by this user to point to a system user or null
      // For now, we'll delete them as well, but you might want to reassign them
      await tx.license.deleteMany({
        where: { creatorId: userId },
      })

      // Delete the user
      await tx.user.delete({
        where: { id: userId },
      })
    })

    return NextResponse.json({
      success: true,
      message: "User đã được xóa thành công",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
