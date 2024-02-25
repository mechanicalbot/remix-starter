import { type ServerBuild } from "@remix-run/node";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        }),
      );

export async function importDevBuild() {
  return viteDevServer!.ssrLoadModule(
    "virtual:remix/server-build" + "?t=" + Date.now(),
  ) as Promise<ServerBuild>;
}
