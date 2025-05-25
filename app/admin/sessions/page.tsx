"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { RevokeSessionButton } from "@/components/revoke-session-button"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Session {
  id: string
  createdAt: Date
  expiresAt: Date
  user: {
    id: string
    name?: string | null
    email: string
    role: string
  }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/sessions/list")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách sessions",
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
    fetchSessions()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Sessions</h1>
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Sessions</h1>
        <p className="text-muted-foreground">Quản lý phiên đăng nhập của người dùng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Sessions</CardTitle>
          <CardDescription>Tổng cộng {sessions.length} phiên đăng nhập</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead>Hết hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const isExpired = new Date(session.expiresAt) < new Date()
                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{session.user.name || session.user.email}</div>
                        <div className="text-sm text-gray-500">{session.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.user.role === "ADMIN" ? "default" : "secondary"}>
                        {session.user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(session.createdAt)}</TableCell>
                    <TableCell>{formatDate(session.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge variant={isExpired ? "destructive" : "default"}>{isExpired ? "Expired" : "Active"}</Badge>
                    </TableCell>
                    <TableCell>
                      <RevokeSessionButton sessionId={session.id} disabled={isExpired} onSuccess={fetchSessions}>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isExpired}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </RevokeSessionButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
