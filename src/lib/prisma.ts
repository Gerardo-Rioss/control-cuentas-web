import { PrismaClient } from "../generated/db/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Return a dummy client for build/CI — will fail at runtime if DB is needed
    return new PrismaClient({ adapter: {} as any });
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
