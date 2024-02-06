import "dotenv/config";

import { serve } from "@hono/node-server";

import { hono, isProductionMode } from "./hono";

if (isProductionMode) {
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

export default hono;
