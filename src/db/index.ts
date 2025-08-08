import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDB(env: Cloudflare.Env) {
  const db = drizzle(env.DB, { schema });
  return db;
}
