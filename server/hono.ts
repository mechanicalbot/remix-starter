import { serveStatic } from "@hono/node-server/serve-static";
import { type ServerBuild } from "@remix-run/server-runtime";
import { type Context, Hono } from "hono";
import { compress } from "hono/compress";
import { remix } from "remix-hono/handler";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";

import { createDb } from "~/db/db.server";
import { type Measurer } from "~/lib/measurer";

import { cache, logger, measurer } from "./lib/hono";

const mode =
  process.env.NODE_ENV === "test" || !process.env.NODE_ENV
    ? "development"
    : process.env.NODE_ENV;

export const isProductionMode = mode === "production";

/* type your Cloudflare bindings here */
type Bindings = Record<string, never>;

/* type your Hono variables (used with c.get/c.set) here */
type Variables = {
  measurer: Measurer;
};

type ContextEnv = { Bindings: Bindings; Variables: Variables };

export const hono = new Hono<ContextEnv>();

hono.use("*", compress());

hono.use(
  "/assets/*",
  cache(60 * 60 * 24 * 365), // 1 year
  serveStatic({ root: "./build/client" }),
);

hono.use(
  "*",
  cache(60 * 60), // 1 day
  serveStatic({ root: "./build/client" }),
);

hono.use(logger());

hono.all("*", measurer, async (ctx, next) => {
  let build: ServerBuild;
  if (isProductionMode) {
    build = (await import(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line import/no-unresolved
      "../build/server/remix.js"
    )) as unknown as ServerBuild;
  } else {
    const vite = await import("vite");
    const viteDevServer = await vite.createServer({
      server: { middlewareMode: true },
    });
    build = (await viteDevServer.ssrLoadModule(
      "virtual:remix/server-build",
    )) as unknown as ServerBuild;
  }

  return remix({
    mode,
    build,
    getLoadContext: async (ctx: Context<ContextEnv>) => ({
      clientIp: getClientIPAddress(ctx.req.raw),
      db: createDb(),
      time: ctx.get("measurer").time,
    }),
  })(ctx, next);
});
