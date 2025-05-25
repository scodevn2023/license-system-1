"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LicensesList } from "@/components/licenses-list"
import { CreateLicenseDialog } from "@/components/create-license-dialog"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface License {
  id: string
  key: string
  type: string
  status: string
  hardwareId?: string | null
  expirationDate: Date
  notes?: string | null
  user: {
    id: string
    name?: string | null
    email: string
  }
  creator: {
    name?: string | null
    email: string
  }
  createdAt: Date
}

interface User {
  id: string
  name?: string | null
  email: string
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      const [licensesRes, usersRes] = await Promise.all([
        fetch("/api/admin/licenses/list"),
        fetch("/api/admin/users/list"),
      ])

      if (licensesRes.ok && usersRes.ok) {
        const licensesData = await licensesRes.json()
        const usersData = await usersRes.json()
        setLicenses(licensesData.licenses || [])
        setUsers(usersData.users || [])
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu",
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
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quản lý Licenses</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Licenses</h1>
          <p className="text-muted-foreground">Quản lý license key và phân phối cho người dùng</p>
        </div>
        <CreateLicenseDialog users={users} onSuccess={fetchData}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo License
          </Button>
        </CreateLicenseDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Licenses</CardTitle>
          <CardDescription>Tổng cộng {licenses.length} license</CardDescription>
        </CardHeader>
        <CardContent>
          <LicensesList licenses={licenses} users={users} onUpdate={fetchData} />
        </CardContent>
      </Card>
    </div>
  )
}
