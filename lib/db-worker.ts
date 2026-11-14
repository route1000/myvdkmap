// Keep the proven query contracts; the official D1 adapter replaces the native SQLite driver.
import { PrismaClient } from "@prisma/client/edge";
import { PrismaD1 } from "@prisma/adapter-d1";
import { env } from "cloudflare:workers";
export const prisma = new PrismaClient({ adapter: new PrismaD1(env.DB) });
