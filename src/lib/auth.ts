import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDB } from "@/db";
import { drizzle } from "drizzle-orm/d1";
import { createMiddleware } from "hono/factory";
import { decryptKey } from "@/utilts/key";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";

export const auth = (env: CloudflareBindings) =>
  betterAuth({
    database: drizzleAdapter(drizzle(env.DB), {
      provider: "sqlite",
      schema: {
        account: schema.account,
        session: schema.session,
        user: schema.user,
        verification: schema.verification,
      },
    }),
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      github: {
        clientId: env.AUTH_GITHUB_ID,
        clientSecret: env.AUTH_GITHUB_SECRET,
        redirectURI: `${env.BETTER_AUTH_URL}/api/auth/callback/github`,
      },
      google: {
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
        redirectURI: `${env.BETTER_AUTH_URL}/api/auth/callback/google`,
      },
    },
  });

export const authMiddleware = createMiddleware(async (c, next) => {
  // Check for bearer token
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const [userId, lastKeyGeneratedAtTimestamp] = await decryptKey(
        token,
        c.env.SECRET
      );
      const user = await createDB(c.env)
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, userId))
        .get();

      if (user) {
        if (!user.lastKeyGeneratedAt || user.lastKeyGeneratedAt === null) {
          // Update user with current timestamp if no lastKeyGeneratedAt
          const now = new Date();
          await createDB(c.env)
            .update(schema.user)
            .set({ lastKeyGeneratedAt: now })
            .where(eq(schema.user.id, userId))
            .run();
          user.lastKeyGeneratedAt = now;
        }

        // Convert both timestamps to numbers for comparison
        const storedTimestamp = user.lastKeyGeneratedAt.getTime();
        const providedTimestamp = Number(lastKeyGeneratedAtTimestamp);

        if (storedTimestamp === providedTimestamp) {
          c.set("user", user);
          c.set("session", null);
          await next();
          return;
        }
      }
    } catch (e) {
      console.error("API Key validation failed:", e);
      return c.json({ error: "Invalid API key" }, 401);
    }

    // If we reach here, the API key was invalid
    return c.json({ error: "Invalid API key" }, 401);
  }

  // Fall back to session-based auth
  const session = await auth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });

  if (session?.user) {
    const user = await createDB(c.env)
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id))
      .get();

    if (
      user &&
      (!user.lastKeyGeneratedAt || user.lastKeyGeneratedAt === null)
    ) {
      // Update user with current timestamp if no lastKeyGeneratedAt
      const now = new Date();
      await createDB(c.env)
        .update(schema.user)
        .set({ lastKeyGeneratedAt: now })
        .where(eq(schema.user.id, user.id))
        .run();
      user.lastKeyGeneratedAt = now;
    }

    c.set("session", session.session || null);
    c.set("user", user || null);
  }
  await next();
});
