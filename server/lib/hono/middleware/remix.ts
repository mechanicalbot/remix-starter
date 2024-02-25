import {
  type AppLoadContext,
  type ServerBuild,
  createRequestHandler,
} from "@remix-run/server-runtime";
import { type Context, type Env } from "hono";
import { createMiddleware } from "hono/factory";

export function remix<TEnv extends Env>({
  build,
  mode,
  getLoadContext = (c) => c.env as AppLoadContext,
}: {
  build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>);
  mode?: string;
  getLoadContext?: (
    c: Context<TEnv>,
  ) => Promise<AppLoadContext> | AppLoadContext;
}) {
  return createMiddleware<TEnv>(async (c) => {
    const requestHandler = createRequestHandler(build, mode);
    const loadContext = getLoadContext(c);

    return await requestHandler(
      c.req.raw,
      loadContext instanceof Promise ? await loadContext : loadContext,
    );
  });
}
