import { relations } from "drizzle-orm";
import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";

import { LoginProvider } from "~/lib/auth/types";

import { users } from "./user";
import { date } from "./utils";

export const userLogins = sqliteTable(
  "userLogins",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider", {
      enum: Object.values(LoginProvider) as AllPermutations<LoginProvider>,
    }).notNull(),
    providerKey: text("providerId").notNull(),
    providerEmail: text("providerEmail").notNull(),
    createdAt: date("createdAt"),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.provider, table.providerKey] }),
    };
  },
);

export type SelectUserLogin = typeof userLogins.$inferSelect;

export type InsertUserLogin = typeof userLogins.$inferInsert;

export const userLoginsRelation = relations(userLogins, ({ one }) => ({
  user: one(users, { fields: [userLogins.userId], references: [users.id] }),
}));
