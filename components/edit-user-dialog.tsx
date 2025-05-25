"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  name?: string | null
  role: string
}

interface EditUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setName(user.name || "")
      setRole(user.role)
      setPassword("")
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updateData: any = { email, name, role }
      if (password) {
        updateData.password = password
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "User đã được cập nhật thành công",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi cập nhật user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa User</DialogTitle>
          <DialogDescription>Cập nhật thông tin người dùng</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Tên</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password mới (để trống nếu không đổi)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
