import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const segments = []

  for (let i = 0; i < 4; i++) {
    let segment = ""
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    segments.push(segment)
  }

  return segments.join("-")
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "text-green-600 bg-green-100"
    case "PENDING":
      return "text-yellow-600 bg-yellow-100"
    case "EXPIRED":
      return "text-red-600 bg-red-100"
    case "REVOKED":
      return "text-gray-600 bg-gray-100"
    default:
      return "text-gray-600 bg-gray-100"
  }
}
