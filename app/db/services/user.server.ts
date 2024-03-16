import { type AppLoadContext } from "@remix-run/node";
import { eq, and } from "drizzle-orm";

import { type Db, schema, getDb } from "../db.server";

export type User = schema.SelectUser;

export type UserLogin = schema.SelectUserLogin;

export class UserService {
  #db: Db;

  constructor(context: AppLoadContext) {
    this.#db = getDb(context);
  }

  findById(id: string): Promise<User | undefined> {
    return this.#db.query.users
      .findFirst({ where: (users, { eq }) => eq(users.id, id) })
      .execute();
  }

  findByEmail(email: string): Promise<User | undefined> {
    return this.#db.query.users
      .findFirst({ where: (users, { eq }) => eq(users.email, email) })
      .execute();
  }

  create(
    user: Omit<schema.InsertUser, "createdAt" | "updatedAt">,
    login?: Omit<schema.InsertUserLogin, "createdAt">,
  ): Promise<User> {
    return this.#db.transaction(async (tx) => {
      const [insertedUser] = await tx
        .insert(schema.users)
        .values({
          ...user,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      if (login) {
        await tx.insert(schema.userLogins).values({
          ...login,
          createdAt: new Date(),
        });
      }

      return insertedUser;
    });
  }

  addLogin(login: Omit<schema.InsertUserLogin, "createdAt">): Promise<void> {
    return this.#db.transaction(async (tx) => {
      await tx.insert(schema.userLogins).values({
        ...login,
        createdAt: new Date(),
      });
      await tx
        .update(schema.users)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, login.userId));
    });
  }

  removeLogin(
    userId: string,
    provider: schema.SelectUserLogin["provider"],
    providerKey: string,
  ): Promise<void> {
    return this.#db.transaction(async (tx) => {
      await tx
        .delete(schema.userLogins)
        .where(
          and(
            eq(schema.userLogins.userId, userId),
            eq(schema.userLogins.provider, provider),
            eq(schema.userLogins.providerKey, providerKey),
          ),
        );

      await tx
        .update(schema.users)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId));
    });
  }

  findLogin(
    provider: schema.SelectUserLogin["provider"],
    providerKey: string,
  ): Promise<UserLogin | undefined> {
    return this.#db.query.userLogins
      .findFirst({
        where: (userLogins, { and, eq }) =>
          and(
            eq(userLogins.provider, provider),
            eq(userLogins.providerKey, providerKey),
          ),
      })
      .execute();
  }

  getLogins(userId: string): Promise<UserLogin[]> {
    return this.#db.query.userLogins
      .findMany({
        where: (userLogins, { eq }) => eq(userLogins.userId, userId),
      })
      .execute();
  }
}
