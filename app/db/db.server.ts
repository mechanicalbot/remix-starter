import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

export { schema };

export const createDb = () => {
  const db = drizzle(new Database("db.sqlite"), { schema });

  return db;
};

export type Db = ReturnType<typeof createDb>;
