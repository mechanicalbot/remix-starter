import "dotenv/config";

import http from "node:http";

import { viteDevServer, hono } from "./hono";

const handler = viteDevServer?.middlewares.use(hono) ?? hono;
const server = http.createServer(handler);

const port = 3000;
server.listen(port, () => {
  console.log("🚀 Server started");
  console.log("Local: \t http://localhost:" + port);
});
