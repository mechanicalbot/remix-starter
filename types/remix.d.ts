import { type Db } from "~/db/db.server";
import { type Measurer } from "~/lib/measurer";

declare module "@remix-run/server-runtime" {
  export interface CustomLoadContext {
    clientIp: string | null;
    db: Db;
  }

  export interface AppLoadContext extends CustomLoadContext {
    time: Measurer["time"];
  }
}
