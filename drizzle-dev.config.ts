import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  out: "./drizzle",
  dbCredentials: {
    url: `file:.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3467bc8e0cf889cfcf64091b2085b1d1c7e761db76be0912a7e3257b8ee3e39e.sqlite`,
  },
});
