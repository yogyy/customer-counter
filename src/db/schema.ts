import {
  integer,
  sqliteTable,
  text,
  sqliteTableCreator,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const customer = sqliteTable("customer", {
  id: text("id").primaryKey(),
  total: integer("total").default(0),
});

const sqliteTable2 = sqliteTableCreator((name) => `ba_${name}`);

export const user = sqliteTable2("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  isAdmin: integer("isAdmin", { mode: "boolean" }).notNull().default(false),
  lastKeyGeneratedAt: integer("lastKeyGeneratedAt", { mode: "timestamp" }),
});

export const session = sqliteTable2("session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  token: text("token").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const account = sqliteTable2("account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable2("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const rateLimit = sqliteTable2("rateLimit", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  endpoint: text("endpoint").notNull(),
  count: integer("count").notNull().default(0),
  resetAt: integer("resetAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const playlistRecommendations = sqliteTable2(
  "playlist_recommendations",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    songTitle: text("songTitle").notNull(),
    songLink: text("songLink"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }
);

export const playlistRecommendationsRelations = relations(
  playlistRecommendations,
  ({ one }) => ({
    recommendedBy: one(user, {
      fields: [playlistRecommendations.userId],
      references: [user.id],
    }),
  })
);

export const userRelations = relations(user, ({ many }) => ({
  recommendations: many(playlistRecommendations),
}));

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type RateLimit = typeof rateLimit.$inferSelect;
export type Customer = typeof customer.$inferInsert;
export type Recomendation = typeof playlistRecommendations.$inferSelect;
