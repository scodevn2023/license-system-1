"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Key, UserCheck, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Stats {
  totalUsers: number
  totalLicenses: number
  activeLicenses: number
  recentUsers: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalLicenses: 0,
    activeLicenses: 0,
    recentUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
        } else {
          toast({
            title: "Lỗi",
            description: "Không thể tải thống kê",
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

    fetchStats()
  }, [toast])

  const statCards = [
    {
      title: "Tổng Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Tổng số người dùng trong hệ thống",
    },
    {
      title: "Tổng Licenses",
      value: stats.totalLicenses,
      icon: Key,
      description: "Tổng số license đã tạo",
    },
    {
      title: "License Đang Hoạt Động",
      value: stats.activeLicenses,
      icon: UserCheck,
      description: "Số license đang được sử dụng",
    },
    {
      title: "Users Mới (7 ngày)",
      value: stats.recentUsers,
      icon: Calendar,
      description: "Người dùng đăng ký trong 7 ngày qua",
    },
  ]

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="text-center">Đang tải...</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Tổng quan hệ thống quản lý license và user</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Các thay đổi mới nhất trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">License mới được kích hoạt</p>
                  <p className="text-xs text-muted-foreground">2 phút trước</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">User mới đăng ký</p>
                  <p className="text-xs text-muted-foreground">15 phút trước</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">License sắp hết hạn</p>
                  <p className="text-xs text-muted-foreground">1 giờ trước</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thống kê license</CardTitle>
            <CardDescription>Phân bố trạng thái license</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Active</span>
                <span className="text-sm font-medium text-green-600">{stats.activeLicenses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending</span>
                <span className="text-sm font-medium text-yellow-600">
                  {stats.totalLicenses - stats.activeLicenses}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total</span>
                <span className="text-sm font-medium">{stats.totalLicenses}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
