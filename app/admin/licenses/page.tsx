import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"
import { LicensesList } from "@/components/licenses-list"
import { CreateLicenseDialog } from "@/components/create-license-dialog"
import { Plus } from "lucide-react"

async function getLicenses() {
  return await prisma.license.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      creator: {
        select: { name: true, email: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

async function getUsers() {
  return await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })
}

export default async function LicensesPage() {
  const [licenses, users] = await Promise.all([getLicenses(), getUsers()])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Licenses</h1>
          <p className="text-muted-foreground">Quản lý license key và phân phối cho người dùng</p>
        </div>
        <CreateLicenseDialog users={users}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo License
          </Button>
        </CreateLicenseDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Licenses</CardTitle>
          <CardDescription>Tổng cộng {licenses.length} license</CardDescription>
        </CardHeader>
        <CardContent>
          <LicensesList licenses={licenses} users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
