import { eq } from "drizzle-orm";

import { type Db, schema } from "../db.server";

export type User = schema.SelectUser;

export class UserService {
  constructor(private readonly db: Db) {}

  findById(id: string) {
    return this.db.query.users
      .findFirst({ where: (users, { eq }) => eq(users.id, id) })
      .execute();
  }

  findByEmail(email: string) {
    return this.db.query.users
      .findFirst({ where: (users, { eq }) => eq(users.email, email) })
      .execute();
  }

  create(
    user: Omit<schema.InsertUser, "createdAt" | "updatedAt">,
    login?: Omit<schema.InsertUserLogin, "createdAt">,
  ) {
    return this.db.transaction(async (tx) => {
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

  addLogin(login: Omit<schema.InsertUserLogin, "createdAt">) {
    return this.db.transaction(async (tx) => {
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

  findLogin(provider: schema.SelectUserLogin["provider"], providerKey: string) {
    return this.db.query.userLogins
      .findFirst({
        where: (userLogins, { and, eq }) =>
          and(
            eq(userLogins.provider, provider),
            eq(userLogins.providerKey, providerKey),
          ),
      })
      .execute();
  }
}
