import { type Env } from "hono";
import { createMiddleware } from "hono/factory";

import { Measurer } from "~/lib/measurer";

declare module "hono" {
  interface ContextVariableMap {
    measurer: Measurer;
  }
}

export const measurer = <TEnv extends Env>() =>
  createMiddleware<TEnv>(async (c, next) => {
    const measurer = new Measurer();
    c.set("measurer", measurer);
    await measurer.time("request", next);
    const measurerHeaders = measurer.toHeaders();
    for (const [key, value] of measurerHeaders) {
      c.res.headers.append(key, value);
    }
  });
