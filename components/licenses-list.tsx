"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, getStatusColor } from "@/lib/utils"
import { EditLicenseDialog } from "./edit-license-dialog"
import { DeleteLicenseDialog } from "./delete-license-dialog"
import { Edit, Trash2, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface License {
  id: string
  key: string
  type: string
  status: string
  hardwareId?: string | null
  activatedAt?: Date | null
  expirationDate: Date
  notes?: string | null
  user: {
    id: string
    name?: string | null
    email: string
  }
  creator: {
    name?: string | null
    email: string
  }
  createdAt: Date
}

interface User {
  id: string
  name?: string | null
  email: string
}

interface LicensesListProps {
  licenses: License[]
  users: User[]
}

export function LicensesList({ licenses, users }: LicensesListProps) {
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const handleEdit = (license: License) => {
    setSelectedLicense(license)
    setShowEditDialog(true)
  }

  const handleDelete = (license: License) => {
    setSelectedLicense(license)
    setShowDeleteDialog(true)
  }

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: "Đã copy",
      description: "License key đã được copy vào clipboard",
    })
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>License Key</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Hết hạn</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license) => (
            <TableRow key={license.id}>
              <TableCell className="font-mono">
                <div className="flex items-center space-x-2">
                  <span className="truncate max-w-[200px]">{license.key}</span>
                  <Button variant="ghost" size="sm" onClick={() => copyLicenseKey(license.key)} className="p-1 h-6 w-6">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{license.type}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(license.status)}>{license.status}</Badge>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{license.user.name || license.user.email}</div>
                  <div className="text-sm text-gray-500">{license.user.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatDate(license.expirationDate)}
                  {new Date(license.expirationDate) < new Date() && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Expired
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(license)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(license)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedLicense && (
        <>
          <EditLicenseDialog
            license={selectedLicense}
            users={users}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />
          <DeleteLicenseDialog license={selectedLicense} open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
        </>
      )}
    </>
  )
}
