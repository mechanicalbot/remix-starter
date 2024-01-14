import { getRequestListener } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { type ServerBuild } from "@remix-run/server-runtime";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";

import { createDb } from "~/db/db.server";

import { logger, remix } from "./lib/hono";

const paths = {
  clientAssets: "./build/client/assets",
  clientPublic: "./build/client",
  server: "./build/server/index.js",
};

const MODE = process.env.NODE_ENV || "development";

export const viteDevServer =
  MODE === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({ server: { middlewareMode: true } }),
      );

const app = new Hono();

app.use("*", compress());

app.use("/assets/*", serveStatic({ root: paths.clientAssets }), (ctx, next) => {
  ctx.header("Cache-Control", "max-age=31536000, immutable");
  return next();
});

app.use("*", serveStatic({ root: paths.clientPublic }), (ctx, next) => {
  // ctx.header("Cache-Control", "max-age=31536000, immutable");
  ctx.header("Cache-Control", "max-age=3600");
  return next();
});

app.use(logger());

app.all(
  "*",
  remix({
    mode: MODE,
    build: viteDevServer
      ? () =>
          viteDevServer.ssrLoadModule(
            "virtual:remix/server-build",
          ) as Promise<ServerBuild>
      : await import(paths.server),
    getLoadContext: async (ctx) => ({
      clientIp: getClientIPAddress(ctx.req.raw),
      db: createDb(),
    }),
  }),
);

export const hono = getRequestListener(app.fetch);
