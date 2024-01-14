import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { type AuthenticateOptions, Authenticator } from "remix-auth";
import { GitHubStrategy } from "remix-auth-github";
import { TOTPStrategy } from "remix-auth-totp-dev";

import { type User } from "~/db/services/user.server";

export interface UserSession {
  id: string;
  email: string;
}

type AuthSession =
  | { provider: "email"; email: string; externalId: string }
  | { provider: "github"; email: string; externalId: string };

const secrets = process.env.COOKIE_SECRET.split(",");

const authSessionStorage = createCookieSessionStorage<{
  user: UserSession;
  issuedAt: number;
}>({
  cookie: {
    name: "auth",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // week
  },
});

const connectionSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "connection",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 min
  },
});

const authenticator = new Authenticator<AuthSession>(connectionSessionStorage, {
  throwOnError: true,
});

const totpStrategy = new TOTPStrategy<AuthSession>(
  {
    secret: process.env.TOTP_SECRET || "STRONG_SECRET",
    magicLinkPath: "/auth/email/callback",
    totpGeneration: {
      charSet: "0123456789",
    },
    sendTOTP: async (args) => {
      console.log("sendTOTP", args);
    },
  },
  async ({ email }) => {
    return { provider: "email", email, externalId: email };
  },
);
authenticator.use(totpStrategy, "email");

const gitHubStrategy = new GitHubStrategy<AuthSession>(
  {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/auth/github/callback",
  },
  async ({ profile }) => {
    const email = profile.emails[0].value;

    return {
      provider: "github",
      externalId: profile.id,
      email,
    };
  },
);
authenticator.use(gitHubStrategy, "github");

class AuthService {
  async getUser(request: Request) {
    const cookie = request.headers.get("cookie");
    const authSession = await authSessionStorage.getSession(cookie);

    return authSession.get("user");
  }

  async requireAnonymous(request: Request): Promise<void> {
    const user = await authService.getUser(request);
    if (user) {
      throw redirect("/");
    }
  }

  async logout(): Promise<never> {
    const authSession = await authSessionStorage.getSession("");
    const connectionSession = await connectionSessionStorage.getSession("");

    throw redirect("/", {
      headers: [
        ["Set-Cookie", await authSessionStorage.destroySession(authSession)],
        [
          "Set-Cookie",
          await connectionSessionStorage.destroySession(connectionSession),
        ],
      ],
    });
  }

  async login(user: User): Promise<never> {
    const authSession = await authSessionStorage.getSession();
    const userSession: UserSession = {
      id: user.id,
      email: user.email,
    };
    authSession.set("user", userSession);
    authSession.set("issuedAt", Date.now());

    const connectionSession = await connectionSessionStorage.getSession();

    throw redirect("/", {
      headers: new Headers([
        ["Set-Cookie", await authSessionStorage.commitSession(authSession)],
        [
          "Set-Cookie",
          await connectionSessionStorage.destroySession(connectionSession),
        ],
      ]),
    });
  }

  async authenticate(
    provider: string,
    request: Request,
    options?: Pick<AuthenticateOptions, "failureRedirect" | "successRedirect">,
  ): Promise<AuthSession> {
    const authOptions = {
      successRedirect: "/",
      throwOnError: false,
      failureRedirect: "/auth/login",
      ...options,
    };

    try {
      const result = await authenticator.authenticate(
        provider,
        request,
        authOptions,
      );
      throw new Error("Authenticator failed to throw an error", {
        cause: result,
      });
    } catch (error: unknown) {
      if (error instanceof Response) {
        const session = await connectionSessionStorage.getSession(
          error.headers.get("set-cookie"),
        );

        const profile = session.get(authenticator.sessionKey) as AuthSession;
        if (profile) {
          return profile;
        }
      }

      throw error;
    }
  }

  async flushSession(request: Request) {
    const session = await connectionSessionStorage.getSession(
      request.headers.get("Cookie"),
    );
    const error = session.get(authenticator.sessionErrorKey) as
      | undefined
      | { message: string };
    const email = session.get("auth:email") as undefined | string;
    const headers = new Headers([
      ["Set-Cookie", await connectionSessionStorage.commitSession(session)],
    ]);

    return {
      error,
      email,
      headers,
    };
  }
}

export const authService = new AuthService();
