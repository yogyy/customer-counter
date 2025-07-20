import { Hono } from "hono";
import { createDB } from "./db";
import { customer } from "./db/schema";
import { eq, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import z4 from "zod/v4";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app
  .get("/", (c) => {
    return c.text("constantine");
  })
  .get("/update", async (c) => {
    await createDB(c.env)
      .update(customer)
      .set({ total: sql`${customer.total} + 1` })
      .where(eq(customer.id, "asdasdasd"));

    return c.json({ message: "total updated." });
  })
  .post(
    "/update",
    zValidator("json", z4.object({ total: z4.number().nonnegative() })),
    async (c) => {
      const { total } = c.req.valid("json");

      await createDB(c.env)
        .update(customer)
        .set({ total })
        .where(eq(customer.id, "asdasdasd"));
      return c.json({ message: "total updated!" });
    }
  )
  .get("/total", async (c) => {
    const result = await createDB(c.env).query.customer.findFirst();
    return c.json(result);
  });

export default app;
