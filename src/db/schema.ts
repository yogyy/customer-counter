import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customer = sqliteTable("customer", {
  id: text("id").primaryKey(),
  total: integer("total").default(0),
});

export type Customer = typeof customer.$inferInsert;
