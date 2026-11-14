import handler from "vinext/server/fetch-handler";
import { ensureSeed } from "../db/seed";
import type { D1Database } from "@cloudflare/workers-types";
export default {
  async fetch(request: Request, env: { DB: D1Database }, ctx: unknown) {
    await ensureSeed(env.DB);
    return handler.fetch(request, env, ctx);
  },
};
