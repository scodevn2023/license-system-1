"use client"

import type React from "react"

import { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { generateLicenseKey } from "@/lib/utils"
import { RefreshCw } from "lucide-react"

interface User {
  id: string
  name?: string | null
  email: string
}

interface CreateLicenseDialogProps {
  children: React.ReactNode
  users: User[]
  onSuccess?: () => void
}

export function CreateLicenseDialog({ children, users, onSuccess }: CreateLicenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [key, setKey] = useState("")
  const [type, setType] = useState("STANDARD")
  const [userId, setUserId] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [notes, setNotes] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleGenerateKey = () => {
    setKey(generateLicenseKey())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          type,
          userId,
          expirationDate,
          notes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "License đã được tạo thành công",
        })
        setOpen(false)
        setKey("")
        setType("STANDARD")
        setUserId("")
        setExpirationDate("")
        setNotes("")
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi tạo license",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo license",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo License Mới</DialogTitle>
          <DialogDescription>Tạo một license key mới và gán cho người dùng</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="key">License Key</Label>
              <div className="flex space-x-2">
                <Input
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  required
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={handleGenerateKey} className="px-3">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
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
              <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
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
              {loading ? "Đang tạo..." : "Tạo License"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
