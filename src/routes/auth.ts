import { Hono } from "hono";
import { auth } from "../lib/auth";
import * as schema from "../db/schema";
import { generateKey } from "../utilts/key";

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    user: schema.User;
    session: schema.Session;
  };
}>();

export const authRouter = app
  .on(["POST", "GET"], "/api/auth/*", (c) => {
    return auth(c.env).handler(c.req.raw);
  })
  .get("/signout", async (c) => {
    await auth(c.env).api.signOut({
      headers: c.req.raw.headers,
    });
    return c.redirect("/");
  })
  .get("/signin/github", async (c) => {
    const signinUrl = await auth(c.env).api.signInSocial({
      body: {
        provider: "github",
        callbackURL: "/",
      },
    });

    if (!signinUrl || !signinUrl.url) {
      return c.text("Failed to sign in", 500);
    }

    return c.redirect(signinUrl.url);
  })
  .get("/signin/google", async (c) => {
    const signinUrl = await auth(c.env).api.signInSocial({
      body: {
        provider: "google",
        callbackURL: "/",
      },
    });

    if (!signinUrl || !signinUrl.url) {
      return c.text("Failed to sign in", 500);
    }

    return c.redirect(signinUrl.url);
  })
  .post("/api/auth/token", async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const lastKeyGeneratedAt = new Date().getTime();
    const token = await generateKey(
      user.id,
      String(lastKeyGeneratedAt),
      c.env.BETTER_AUTH_SECRET
    );

    return c.json({ token });
  });
