import { type Db } from "~/db/db.server";
import { type Measurer } from "~/lib/measurer";

declare module "@remix-run/server-runtime" {
  export interface AppLoadContext {
    clientIp: string | null;
    db: Db;
    time: Measurer["time"];
  }
}
