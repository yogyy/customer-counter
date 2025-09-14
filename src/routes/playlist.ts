import { Hono } from "hono";
import { playlistRecommendations as schema, User, Session } from "../db/schema";
import { createDB } from "@/db";
import z4 from "zod/v4";
import { zValidator } from "@hono/zod-validator";
import { nanoid } from "nanoid";
import { and, eq, lt } from "drizzle-orm";

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    user: User;
    session: Session;
  };
}>();

const playlistSchema = z4.object({
  songTitle: z4.string(),
  songLink: z4.string().optional(),
});

const playlistIdSchema = z4.object({
  id: z4.nanoid(),
});

const paginationSchema = z4.object({
  before: z4.string().optional(),
});

export const playlistRouter = app
  .get("/", zValidator("query", paginationSchema), async (c) => {
    const { before } = c.req.valid("query");
    console.log(before);
    try {
      const playlist = await createDB(
        c.env
      ).query.playlistRecommendations.findMany({
        orderBy: ({ createdAt }, { desc }) => [desc(createdAt)],
        where: before ? lt(schema.createdAt, new Date(before)) : undefined,
        limit: 30,
        with: {
          recommendedBy: {
            columns: {
              name: true,
              image: true,
            },
          },
        },
      });

      return c.json({
        data: playlist,
        nextCursor: playlist.at(-1)?.createdAt ?? null,
      });
    } catch (err) {
      return c.json({ error: "Failed to fetch playlist" }, 500);
    }
  })
  .use(async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await next();
  })
  .post("/", zValidator("json", playlistSchema), async (c) => {
    const { songTitle, songLink } = c.req.valid("json");
    const user = c.get("user");

    try {
      const [playlist] = await createDB(c.env)
        .insert(schema)
        .values({
          id: nanoid(),
          userId: user.id,
          songTitle: songTitle,
          songLink: songLink,
        })
        .returning();
      return c.json(playlist, 201);
    } catch (err) {
      console.error(err);
      return c.json({ error: "Failed to create playlist" }, 500);
    }
  })
  .delete("/:id", zValidator("param", playlistIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const user = c.get("user");
    try {
      const data = await createDB(c.env)
        .delete(schema)
        .where(and(eq(schema.id, id), eq(schema.userId, user.id)))
        .returning({ deletedId: schema.id });

      if (!data.length) {
        return c.json({ error: "Recommendation not Found." }, 404);
      }

      return c.json({ message: "Recommendation Deleted." });
    } catch (err) {
      console.error(err);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  });
