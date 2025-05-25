import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"

export default async function HomePage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this panel.</p>
        </div>
      </div>
    )
  }

  redirect("/admin")
}
