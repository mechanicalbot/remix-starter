import { integer } from "drizzle-orm/sqlite-core/columns";

export const date = (name: string) => integer(name, { mode: "timestamp_ms" });

export const boolean = (name: string) => integer(name, { mode: "boolean" });
