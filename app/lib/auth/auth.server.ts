import {
  type AppLoadContext,
  type SessionStorage,
  createCookieSessionStorage,
  redirect,
} from "@remix-run/node";
import {
  type AuthenticateOptions,
  Authenticator,
  type Strategy,
} from "remix-auth";
import {
  GoogleStrategy,
  GitHubStrategy,
  FacebookStrategy,
} from "remix-auth-socials";
import { TOTPStrategy } from "remix-auth-totp";
import { safeRedirect } from "remix-utils/safe-redirect";

import { type User } from "~/db/services/user.server";
import { sendEmail } from "~/lib/email.server";
import { invariant } from "~/lib/invariant";
import { redirectToHelper } from "~/lib/redirectTo.server";
import { combineResponseInits } from "~/lib/web";

import { LoginProvider, type UserSession } from "./types";

export type AuthSession = {
  provider: LoginProvider;
  email: string;
  externalId: string;
};

export class AuthService {
  #authSessionStorage: SessionStorage<{
    user: UserSession;
    issuedAt: number;
  }>;

  #connectionSessionStorage: SessionStorage;

  #authenticator: Authenticator<AuthSession>;

  constructor(context: AppLoadContext) {
    const secrets = context.env.COOKIE_SECRET.split(",");

    this.#authSessionStorage = createCookieSessionStorage<{
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

    this.#connectionSessionStorage = createCookieSessionStorage({
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

    this.#authenticator = new Authenticator<AuthSession>(
      this.#connectionSessionStorage,
      {
        throwOnError: true,
      },
    );

    const getCallbackUrl = (provider: LoginProvider) =>
      `/auth/${provider}/callback`;

    const providerStrategyMap: Record<
      LoginProvider,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Strategy<AuthSession, any>
    > = {
      // https://github.com/dev-xo/remix-auth-totp
      [LoginProvider.Email]: new TOTPStrategy<AuthSession>(
        {
          secret: context.env.TOTP_SECRET,
          magicLinkPath: getCallbackUrl(LoginProvider.Email),
          totpGeneration: {
            charSet: "0123456789",
          },
          sendTOTP: async (args) => {
            await sendEmail({
              to: args.email,
              subject: "Magic Link",
              body: `Welcome to The App!
      The code will expire 10 minutes after you receive this email.
      Your verification code: ${args.code}
      Or click this magic link to continue: ${args.magicLink}
      `,
            });
          },
        },
        async ({ email }) => {
          return { provider: LoginProvider.Email, email, externalId: email };
        },
      ),
      // https://github.com/sergiodxa/remix-auth-github
      [LoginProvider.GitHub]: new GitHubStrategy<AuthSession>(
        {
          clientID: context.env.GITHUB_CLIENT_ID,
          clientSecret: context.env.GITHUB_CLIENT_SECRET,
          callbackURL: getCallbackUrl(LoginProvider.GitHub),
        },
        async ({ profile }) => {
          const email = profile.emails[0].value;

          return {
            provider: LoginProvider.GitHub,
            externalId: profile.id,
            email,
          };
        },
      ),
      // https://github.com/pbteja1998/remix-auth-google
      [LoginProvider.Google]: new GoogleStrategy<AuthSession>(
        {
          clientID: context.env.GOOGLE_CLIENT_ID,
          clientSecret: context.env.GOOGLE_CLIENT_SECRET,
          callbackURL: getCallbackUrl(LoginProvider.Google),
          scope: "openid email profile",
          prompt: "select_account",
        },
        async ({ profile }) => {
          invariant(profile._json.email_verified, "Email not verified");

          const email = profile.emails[0].value;

          return {
            provider: LoginProvider.Google,
            externalId: profile.id,
            email,
          };
        },
      ),
      // https://github.com/manosim/remix-auth-facebook
      [LoginProvider.Facebook]: new FacebookStrategy<AuthSession>(
        {
          clientID: context.env.FACEBOOK_CLIENT_ID,
          clientSecret: context.env.FACEBOOK_CLIENT_SECRET,
          callbackURL: getCallbackUrl(LoginProvider.Facebook),
        },
        async ({ profile }) => {
          const email = profile.emails[0].value;

          return {
            provider: LoginProvider.Facebook,
            externalId: profile.id,
            email,
          };
        },
      ),
    };

    Object.entries(providerStrategyMap).forEach(([provider, strategy]) => {
      this.#authenticator.use(strategy, provider);
    });
  }

  async getUser(request: Request) {
    const cookie = request.headers.get("cookie");
    const authSession = await this.#authSessionStorage.getSession(cookie);

    return authSession.get("user");
  }

  async requireUser(request: Request) {
    const user = await this.getUser(request);
    if (!user) {
      throw redirect(
        `/auth/login?${redirectToHelper.toSearchString(request.url)}`,
      );
    }

    return user;
  }

  async requireAnonymous(request: Request): Promise<void> {
    const user = await this.getUser(request);
    if (user) {
      throw redirect("/");
    }
  }

  async logout(): Promise<never> {
    const authSession = await this.#authSessionStorage.getSession("");
    const connectionSession =
      await this.#connectionSessionStorage.getSession("");

    throw redirect("/", {
      headers: [
        [
          "Set-Cookie",
          await this.#authSessionStorage.destroySession(authSession),
        ],
        [
          "Set-Cookie",
          await this.#connectionSessionStorage.destroySession(
            connectionSession,
          ),
        ],
      ],
    });
  }

  async login(
    user: User,
    options: {
      redirectTo?: string | null;
      init?: ResponseInit;
    } = {},
  ): Promise<never> {
    const authSession = await this.#authSessionStorage.getSession();
    const userSession: UserSession = {
      id: user.id,
      email: user.email,
    };
    authSession.set("user", userSession);
    authSession.set("issuedAt", Date.now());

    const connectionSession = await this.#connectionSessionStorage.getSession();

    throw redirect(
      safeRedirect(options.redirectTo, "/"),
      combineResponseInits(options.init, {
        headers: new Headers([
          [
            "Set-Cookie",
            await this.#authSessionStorage.commitSession(authSession),
          ],
          [
            "Set-Cookie",
            await this.#connectionSessionStorage.destroySession(
              connectionSession,
            ),
          ],
        ]),
      }),
    );
  }

  async authenticate(
    provider: LoginProvider,
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
      const result = await this.#authenticator.authenticate(
        provider,
        request,
        authOptions,
      );
      throw new Error("Authenticator failed to throw an error", {
        cause: result,
      });
    } catch (error: unknown) {
      if (error instanceof Response) {
        const session = await this.#connectionSessionStorage.getSession(
          error.headers.get("set-cookie"),
        );

        const profile = session.get(
          this.#authenticator.sessionKey,
        ) as AuthSession;
        if (profile) {
          return profile;
        }
      }

      throw error;
    }
  }

  async flash(request: Request) {
    const session = await this.#connectionSessionStorage.getSession(
      request.headers.get("Cookie"),
    );
    const error = session.get(this.#authenticator.sessionErrorKey) as
      | undefined
      | { message: string };
    const email = session.get("auth:email") as undefined | string;
    const headers = new Headers([
      [
        "Set-Cookie",
        await this.#connectionSessionStorage.commitSession(session),
      ],
    ]);

    return {
      error,
      email,
      headers,
    };
  }
}
