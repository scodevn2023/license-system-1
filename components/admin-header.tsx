"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminHeaderProps {
  user: {
    id: string
    email: string
    name?: string
    role: string
  }
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      toast({
        title: "Đã đăng xuất",
        description: "Đăng xuất thành công",
      })
      router.push("/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi đăng xuất",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Admin Control Panel</h1>
          <p className="text-sm text-gray-500">License & User Management System</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{user.name || user.email}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{user.role}</span>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
