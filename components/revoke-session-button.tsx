"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface RevokeSessionButtonProps {
  sessionId: string
  children: React.ReactNode
  disabled?: boolean
}

export function RevokeSessionButton({ sessionId, children, disabled }: RevokeSessionButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRevoke = async () => {
    if (disabled) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Session đã được thu hồi",
        })
        router.refresh()
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Có lỗi xảy ra khi thu hồi session",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi thu hồi session",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={handleRevoke} style={{ pointerEvents: disabled || loading ? "none" : "auto" }}>
      {children}
    </div>
  )
}
