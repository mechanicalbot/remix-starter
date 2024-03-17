import { describe, type Mocked, beforeEach, it, vi, expect } from "vitest";

import { type User, type UserService } from "~/db/services/user.server";
import { type AuthSession } from "~/lib/auth/auth.server";
import { LoginProvider } from "~/lib/auth/types";

import { handleProviderCallback } from "./auth.$provider.callback";

describe("handleProviderCallback", () => {
  let userService: Mocked<UserService>;
  let session: AuthSession;
  let currentUser: User | undefined;

  beforeEach(() => {
    userService = {} as Mocked<UserService>;
    session = {
      provider: LoginProvider.Google,
      externalId: "testExternalId",
      email: "testEmail",
    };
    currentUser = {
      id: "testUserId",
      email: "testEmail",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  it("should return AlreadyLinked when existing login matches current user", async () => {
    userService.findLogin = vi.fn().mockResolvedValue({
      userId: currentUser!.id,
      provider: session.provider,
      providerKey: session.externalId,
      providerEmail: session.email,
      createdAt: new Date(),
    });

    const result = await handleProviderCallback(
      session,
      currentUser,
      userService,
    );

    expect(result).toEqual({
      type: "AlreadyLinked",
    });
  });

  it("should return Conflict when existing login does not match current user", async () => {
    userService.findLogin = vi.fn().mockResolvedValue({
      userId: "otherUserId",
      provider: session.provider,
      providerKey: session.externalId,
      providerEmail: session.email,
      createdAt: new Date(),
    });

    const result = await handleProviderCallback(
      session,
      currentUser,
      userService,
    );

    expect(result).toEqual({
      type: "Conflict",
    });
  });

  it("should return Linked when currentUser exists but no existing login", async () => {
    userService.findLogin = vi.fn().mockResolvedValue(null);
    userService.addLogin = vi.fn().mockResolvedValue(undefined);

    const result = await handleProviderCallback(
      session,
      currentUser,
      userService,
    );

    expect(result).toEqual({
      type: "Linked",
      currentUser,
    });
  });

  it("should return Login when existing login exists but no currentUser", async () => {
    userService.findLogin = vi.fn().mockResolvedValue({
      userId: "otherUserId",
      provider: session.provider,
      providerKey: session.externalId,
      providerEmail: session.email,
      createdAt: new Date(),
    });
    userService.findById = vi.fn().mockResolvedValue(currentUser);

    const result = await handleProviderCallback(
      session,
      undefined,
      userService,
    );

    expect(result).toEqual({
      type: "Login",
      foundUser: currentUser,
    });
  });

  it("should throw an error when existing login exists but user is not found", async () => {
    userService.findLogin = vi.fn().mockResolvedValue({
      userId: "otherUserId",
      provider: session.provider,
      providerKey: session.externalId,
      providerEmail: session.email,
      createdAt: new Date(),
    });
    userService.findById = vi.fn().mockResolvedValue(undefined);

    const result = handleProviderCallback(session, undefined, userService);

    await expect(result).rejects.toThrow("User not found");
  });

  it("should return AutomaticallyLinked when no existing login and profile user found by email", async () => {
    userService.findLogin = vi.fn().mockResolvedValue(null);
    userService.findByEmail = vi.fn().mockResolvedValue(currentUser);
    userService.addLogin = vi.fn().mockResolvedValue(undefined);

    const result = await handleProviderCallback(
      session,
      undefined,
      userService,
    );

    expect(result).toEqual({
      type: "AutomaticallyLinked",
      profileUser: currentUser,
    });
  });

  it("should return UserCreated when no existing login and no profile user found by email", async () => {
    userService.findLogin = vi.fn().mockResolvedValue(null);
    userService.findByEmail = vi.fn().mockResolvedValue(null);
    userService.create = vi.fn().mockResolvedValue(currentUser);

    const result = await handleProviderCallback(
      session,
      undefined,
      userService,
    );

    expect(result).toEqual({
      type: "UserCreated",
      newUser: currentUser,
    });
  });
});
