"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
}

interface User {
  id: string
  name?: string | null
  email: string
}

interface EditLicenseDialogProps {
  license: License
  users: User[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditLicenseDialog({ license, users, open, onOpenChange }: EditLicenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [key, setKey] = useState("")
  const [type, setType] = useState("")
  const [status, setStatus] = useState("")
  const [userId, setUserId] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [notes, setNotes] = useState("")
  const [hardwareId, setHardwareId] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (license) {
      setKey(license.key)
      setType(license.type)
      setStatus(license.status)
      setUserId(license.user.id)
      setExpirationDate(new Date(license.expirationDate).toISOString().slice(0, 16))
      setNotes(license.notes || "")
      setHardwareId(license.hardwareId || "")
    }
  }, [license])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/licenses/${license.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          type,
          status,
          userId,
          expirationDate,
          notes,
          hardwareId: hardwareId || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "License đã được cập nhật thành công",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi cập nhật license",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật license",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa License</DialogTitle>
          <DialogDescription>Cập nhật thông tin license</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="key">License Key</Label>
              <Input id="key" value={key} onChange={(e) => setKey(e.target.value)} required className="font-mono" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Loại License</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại license" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">STANDARD</SelectItem>
                  <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                  <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                  <SelectItem value="TRIAL">TRIAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                  <SelectItem value="REVOKED">REVOKED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userId">Gán cho User</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expirationDate">Ngày hết hạn</Label>
              <Input
                id="expirationDate"
                type="datetime-local"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hardwareId">Hardware ID</Label>
              <Input
                id="hardwareId"
                value={hardwareId}
                onChange={(e) => setHardwareId(e.target.value)}
                placeholder="Hardware ID (nếu có)"
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú về license này..."
                rows={3}
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
