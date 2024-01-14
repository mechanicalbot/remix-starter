import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { userLogins } from "./userLogins";
import { date } from "./utils";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull(),
  createdAt: date("createdAt"),
  updatedAt: date("updatedAt"),
});

export type SelectUser = typeof users.$inferSelect;

export type InsertUser = typeof users.$inferInsert;

export const usersRelation = relations(users, ({ many }) => ({
  logins: many(userLogins),
}));
