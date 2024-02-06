import { type MiddlewareHandler } from "hono";

import { Measurer } from "~/lib/measurer";

export const measurer: MiddlewareHandler<{
  Variables: {
    measurer: Measurer;
  };
}> = async (c, next) => {
  const measurer = new Measurer();
  c.set("measurer", measurer);
  await measurer.time("request", next);
  const measurerHeaders = measurer.toHeaders();
  for (const [key, value] of measurerHeaders) {
    c.res.headers.append(key, value);
  }
};
