let prisma: any

if (typeof window === "undefined") {
  if (process.env.NODE_ENV === "production") {
    prisma = new (require("@prisma/client").PrismaClient)()
  } else {
    if (!(global as any).prisma) {
      ;(global as any).prisma = new (require("@prisma/client").PrismaClient)()
    }
    prisma = (global as any).prisma
  }
}

export { prisma }
