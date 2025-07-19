import { drizzle } from "drizzle-orm/d1";
import { customer } from "./schema";

export function createDB(env: Cloudflare.Env) {
  const db = drizzle(env.DB, {
    schema: { customer },
  });
  return db;
}
