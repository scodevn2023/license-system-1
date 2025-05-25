let prisma: any

if (typeof window === "undefined") {
  if (process.env.NODE_ENV === "production") {
    prisma = new (require("@prisma/client").PrismaClient)({
      log: ["error"],
    })
  } else {
    if (!(global as any).prisma) {
      ;(global as any).prisma = new (require("@prisma/client").PrismaClient)({
        log: ["query", "error", "warn"],
      })
    }
    prisma = (global as any).prisma
  }
}

export { prisma }
