"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersList } from "@/components/users-list"
import { CreateUserDialog } from "@/components/create-user-dialog"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  name?: string | null
  role: string
  createdAt: Date
  _count: {
    licenses: number
    createdLicenses: number
  }
  licenses: Array<{
    id: string
    key: string
    status: string
    type: string
  }>
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users/list")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách users",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải dữ liệu",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý Users</h1>
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Đang tải...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Users</h1>
          <p className="text-muted-foreground">Quản lý người dùng và phân quyền trong hệ thống</p>
        </div>
        <CreateUserDialog onSuccess={fetchUsers}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo User
          </Button>
        </CreateUserDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Users</CardTitle>
          <CardDescription>Tổng cộng {users.length} người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersList users={users} onUpdate={fetchUsers} />
        </CardContent>
      </Card>
    </div>
  )
}
