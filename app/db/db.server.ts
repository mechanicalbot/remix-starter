import { type AppLoadContext } from "@remix-run/node";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

export { schema };

export function getDb(context: AppLoadContext) {
  const db = drizzle(context.db, { schema });

  return db;
}

export type Db = ReturnType<typeof getDb>;
