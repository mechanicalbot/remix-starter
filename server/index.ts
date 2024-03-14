import "dotenv/config";

import fs from "node:fs";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { Hono } from "hono";
import { env as getEnv } from "hono/adapter";
import { compress } from "hono/compress";
import { getClientIPAddress } from "remix-utils/get-client-ip-address";

import { EnvSchema } from "~/lib/env.server.js";

import { cache, importDevBuild, logger, measurer, remix } from "./lib/hono";

const mode =
  process.env.NODE_ENV === "test" || !process.env.NODE_ENV
    ? "development"
    : process.env.NODE_ENV;

const isProduction = mode === "production";

export const hono = new Hono();

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

hono.all(
  "*",
  measurer(),
  remix({
    mode: process.env.NODE_ENV,
    build: isProduction
      ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line import/no-unresolved
        () => import("../build/server/remix.js") as Promise<ServerBuild>
      : importDevBuild,
    getLoadContext: (ctx) => ({
      env: EnvSchema.parse(getEnv(ctx)),
      clientIp: getClientIPAddress(ctx.req.raw),
      db: new Database("./db/db.sqlite"),
      time: ctx.var.measurer.time,
    }),
  }),
);

console.log("Migrating database...");
migrateDb();

if (isProduction) {
  serve(
    {
      ...hono,
      port: Number(process.env.PORT) || 3000,
    },
    (info) => {
      console.log("🚀 Server started");
      console.log("Local: \t http://localhost:" + info.port);
    },
  );
}

function migrateDb() {
  if (!fs.existsSync("./db")) {
    fs.mkdirSync("./db");
  }
  const db = new Database("./db/db.sqlite");
  migrate(drizzle(db), {
    migrationsFolder: "./app/db/migrations",
  });
}

export default hono;
