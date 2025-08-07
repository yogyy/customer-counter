import { Hono } from "hono";
import { createDB } from "./db";
import { customer } from "./db/schema";
import type { Session, User } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import z4 from "zod/v4";
import { cors } from "hono/cors";
import { Redis } from "@upstash/redis/cloudflare";
import { authMiddleware, authRouter } from "./lib/auth";

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    user: User;
    session: Session;
  };
}>();
const customerId = "yogg_F8pXzR7t-Q2nWJvBcY_5";
const cacheKey = "customer:counter";

app
  .use(authMiddleware)
  .use(
    "/api/*",
    cors({ origin: ["https://binar-binar.pages.dev", "http://localhost:5173"] })
  );

app
  .get("/", (c) => {
    const user = c.get("user");

    if (!user) {
      return c.text("constantine");
    }
    return c.text(user.name);
  })

  .route("/", authRouter)
  .basePath("/api")
  .get("/total", async (c) => {
    const redis = Redis.fromEnv(c.env);

    try {
      const cached = await redis.hgetall(cacheKey);
      if (cached) return c.json(cached);

      const result = await createDB(c.env).query.customer.findFirst({
        where: eq(customer.id, customerId),
      });

      if (result) {
        const p = redis.pipeline();
        p.hset(cacheKey, result);
        p.expire(cacheKey, 300);

        await p.exec();
      }

      return c.json(result);
    } catch (err) {
      console.error(err);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .use(async (c, next) => {
    const user = c.get("user");
    if (!user?.isAdmin) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await next();
  })
  .get("/update", async (c) => {
    try {
      const [data] = await createDB(c.env)
        .update(customer)
        .set({ total: sql`${customer.total} + 1` })
        .where(eq(customer.id, customerId))
        .returning();

      const redis = Redis.fromEnv(c.env);
      const cached = await redis.hgetall(cacheKey);

      if (cached) await redis.hset(cacheKey, data);

      return c.json({ message: "total updated." });
    } catch (err) {
      console.error(err);
      return c.json({ error: "Internal server error" }, 500);
    }
  })
  .post(
    "/update",
    zValidator("json", z4.object({ total: z4.number().nonnegative() })),
    async (c) => {
      const { total } = c.req.valid("json");

      try {
        const [data] = await createDB(c.env)
          .update(customer)
          .set({ total })
          .where(eq(customer.id, customerId))
          .returning();

        const redis = Redis.fromEnv(c.env);
        const cached = await redis.hgetall(cacheKey);

        if (cached) await redis.hset(cacheKey, data);

        return c.json({ message: "total updated!" });
      } catch (err) {
        console.error(err);
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  );

export default app;
