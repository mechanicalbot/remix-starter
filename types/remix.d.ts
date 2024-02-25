import type Database from "better-sqlite3";

import { type Env } from "~/lib/env.server";
import { type Measurer } from "~/lib/measurer";

declare module "@remix-run/server-runtime" {
  export interface AppLoadContext {
    clientIp: string | null;
    db: Database;
    time: Measurer["time"];
    env: Env;
  }
}
