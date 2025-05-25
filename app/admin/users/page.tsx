import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"
import { UsersList } from "@/components/users-list"
import { CreateUserDialog } from "@/components/create-user-dialog"
import { Plus } from "lucide-react"

async function getUsers() {
  return await prisma.user.findMany({
    include: {
      licenses: {
        include: {
          creator: {
            select: { name: true, email: true },
          },
        },
      },
      _count: {
        select: {
          licenses: true,
          createdLicenses: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Users</h1>
          <p className="text-muted-foreground">Quản lý người dùng và phân quyền trong hệ thống</p>
        </div>
        <CreateUserDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo User
          </Button>
        </CreateUserDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Users</CardTitle>
          <CardDescription>Tổng cộng {users.length} người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersList users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
