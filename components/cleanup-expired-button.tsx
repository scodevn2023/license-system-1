"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface CleanupExpiredButtonProps {
  children: React.ReactNode
}

export function CleanupExpiredButton({ children }: CleanupExpiredButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleCleanup = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/admin/cleanup/expired-licenses", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Thành công",
          description: `Đã dọn dẹp ${data.deletedCount} license hết hạn`,
        })
        router.refresh()
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi dọn dẹp",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi dọn dẹp",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={handleCleanup} style={{ pointerEvents: loading ? "none" : "auto" }}>
      {children}
    </div>
  )
}
