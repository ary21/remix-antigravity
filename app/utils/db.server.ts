import { PrismaClient } from "@prisma/client";
import { env } from "../env.server";

let prisma: PrismaClient;

declare global {
  var __db__: PrismaClient;
}

if (env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
  prisma.$connect();
}

export { prisma };
