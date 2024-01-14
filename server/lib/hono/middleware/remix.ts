import {
  type AppLoadContext,
  type CustomLoadContext,
  type ServerBuild,
  createRequestHandler,
} from "@remix-run/server-runtime";
import { type Handler, type Context } from "hono";

import { Measurer } from "~/lib/measurer";

export type RemixArgs = {
  build: ServerBuild | (() => Promise<ServerBuild>);
  mode: string;
  getLoadContext: (
    ctx: Context,
  ) => CustomLoadContext | Promise<CustomLoadContext>;
};

export const remix = ({ build, mode, getLoadContext }: RemixArgs): Handler => {
  const requestHandler = createRequestHandler(build, mode);

  return async function remix(ctx) {
    const measurer = new Measurer();

    const loadContext = await getLoadContext(ctx);
    const appLoadContext: AppLoadContext = {
      ...loadContext,
      time: measurer.time,
    };

    const response = await measurer.time("request", () =>
      requestHandler(ctx.req.raw, appLoadContext),
    );
    measurer.toHeaders(response.headers);

    return response;
  };
};
