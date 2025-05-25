"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { EditUserDialog } from "./edit-user-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { Edit, Trash2, Key } from "lucide-react"

interface User {
  id: string
  email: string
  name?: string | null
  role: string
  createdAt: Date
  _count: {
    licenses: number
    createdLicenses: number
  }
  licenses: Array<{
    id: string
    key: string
    status: string
    type: string
  }>
}

interface UsersListProps {
  users: User[]
}

export function UsersList({ users }: UsersListProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setShowEditDialog(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Licenses</TableHead>
            <TableHead>Tạo lúc</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{user.name || "-"}</TableCell>
              <TableCell>
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-gray-400" />
                  <span>{user._count.licenses}</span>
                  {user._count.licenses > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {user.licenses.filter((l) => l.status === "ACTIVE").length} active
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(user)}
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

      {selectedUser && (
        <>
          <EditUserDialog user={selectedUser} open={showEditDialog} onOpenChange={setShowEditDialog} />
          <DeleteUserDialog user={selectedUser} open={showDeleteDialog} onOpenChange={setShowDeleteDialog} />
        </>
      )}
    </>
  )
}
