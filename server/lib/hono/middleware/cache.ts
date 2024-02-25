import { type Env } from "hono";
import { createMiddleware } from "hono/factory";

export function cache<TEnv extends Env = Env>(seconds: number) {
  return createMiddleware<TEnv>(async (c, next) => {
    if (!c.req.path.match(/\.[a-zA-Z0-9]+$/)) {
      return next();
    }

    await next();

    if (!c.res.ok) {
      return;
    }

    c.res.headers.set("cache-control", `public, max-age=${seconds}`);
  });
}
