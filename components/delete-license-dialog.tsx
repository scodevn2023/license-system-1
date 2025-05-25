"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle } from "lucide-react"

interface License {
  id: string
  key: string
  type: string
  status: string
  user: {
    name?: string | null
    email: string
  }
}

interface DeleteLicenseDialogProps {
  license: License
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteLicenseDialog({ license, open, onOpenChange }: DeleteLicenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/licenses/${license.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "License đã được xóa thành công",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi xóa license",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xóa license",
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
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Xóa License
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa license <strong>{license.key}</strong>?
            <br />
            License này thuộc về: <strong>{license.user.name || license.user.email}</strong>
            <br />
            <span className="text-red-600 font-medium">Hành động này không thể hoàn tác.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Đang xóa..." : "Xóa License"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
