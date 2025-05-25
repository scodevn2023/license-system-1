import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/db"
import { CleanupExpiredButton } from "@/components/cleanup-expired-button"
import { Database, Trash2, RefreshCw, Settings } from "lucide-react"

async function getSystemStats() {
  const [totalUsers, totalLicenses, activeLicenses, expiredLicenses, totalSessions, activeSessions] = await Promise.all(
    [
      prisma.user.count(),
      prisma.license.count(),
      prisma.license.count({ where: { status: "ACTIVE" } }),
      prisma.license.count({
        where: {
          OR: [{ status: "EXPIRED" }, { expirationDate: { lt: new Date() } }],
        },
      }),
      prisma.session.count(),
      prisma.session.count({
        where: {
          expiresAt: { gt: new Date() },
        },
      }),
    ],
  )

  return {
    totalUsers,
    totalLicenses,
    activeLicenses,
    expiredLicenses,
    totalSessions,
    activeSessions,
  }
}

export default async function SettingsPage() {
  const stats = await getSystemStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground">Quản lý cấu hình và bảo trì hệ thống</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Thống kê hệ thống
            </CardTitle>
            <CardDescription>Tổng quan về dữ liệu trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Tổng Users</Label>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Tổng Licenses</Label>
                <div className="text-2xl font-bold">{stats.totalLicenses}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">License Active</Label>
                <div className="text-2xl font-bold text-green-600">{stats.activeLicenses}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">License Expired</Label>
                <div className="text-2xl font-bold text-red-600">{stats.expiredLicenses}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Tổng Sessions</Label>
                <div className="text-2xl font-bold">{stats.totalSessions}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Sessions Active</Label>
                <div className="text-2xl font-bold text-blue-600">{stats.activeSessions}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Bảo trì hệ thống
            </CardTitle>
            <CardDescription>Các công cụ bảo trì và dọn dẹp dữ liệu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Dọn dẹp License hết hạn</Label>
                  <p className="text-sm text-muted-foreground">Xóa các license đã hết hạn khỏi hệ thống</p>
                </div>
                <CleanupExpiredButton>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Dọn dẹp
                  </Button>
                </CleanupExpiredButton>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Dọn dẹp Session hết hạn</Label>
                  <p className="text-sm text-muted-foreground">Xóa các session đã hết hạn khỏi database</p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Dọn dẹp
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Backup Database</Label>
                  <p className="text-sm text-muted-foreground">Tạo bản sao lưu dữ liệu hệ thống</p>
                </div>
                <Button variant="outline" size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  Backup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* License Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình License</CardTitle>
          <CardDescription>Thiết lập các thông số mặc định cho license</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultExpiry">Thời hạn mặc định (ngày)</Label>
              <Input id="defaultExpiry" type="number" defaultValue="365" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLicensesPerUser">Số license tối đa mỗi user</Label>
              <Input id="maxLicensesPerUser" type="number" defaultValue="5" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>Lưu cấu hình</Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin hệ thống</CardTitle>
          <CardDescription>Chi tiết về phiên bản và cấu hình</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Phiên bản</Label>
              <Badge variant="outline">v1.0.0</Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Database</Label>
              <Badge variant="outline">PostgreSQL</Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Environment</Label>
              <Badge variant="outline">{process.env.NODE_ENV}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
