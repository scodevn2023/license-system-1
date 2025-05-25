import type React from "react"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
