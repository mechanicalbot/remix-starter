import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { nanoid } from "nanoid";

import {
  type User,
  UserService,
  type UserLogin,
} from "~/db/services/user.server";
import { AuthService, type AuthSession } from "~/lib/auth/auth.server";
import { loginProviderDescriptors } from "~/lib/auth/loginProviders";
import { LoginProviderSchema } from "~/lib/auth/types";
import { invariant } from "~/lib/invariant";
import { redirectToHelper } from "~/lib/redirectTo.server";
import { Toasts } from "~/lib/toasts.server";
import { combineHeaders } from "~/lib/web";

async function getUser(
  request: Request,
  authService: AuthService,
  userService: UserService,
) {
  const currentSession = await authService.getUser(request);
  if (!currentSession) {
    return undefined;
  }

  const user = await userService.findById(currentSession.id);
  if (!user) {
    console.log("Logout deleted user");
    return authService.logout();
  }

  return user;
}

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const authService = new AuthService(context);
  const userService = new UserService(context);
  const toasts = new Toasts(context);

  const provider = LoginProviderSchema.parse(params.provider);
  const providerName = loginProviderDescriptors[provider].name;
  const session = await authService.authenticate(provider, request, {
    failureRedirect: "/auth/login",
  });

  const currentUser = await getUser(request, authService, userService);

  const result = await handleProviderCallback(
    session,
    currentUser,
    userService,
  );

  switch (result.type) {
    case "AlreadyLinked": {
      return redirect("/settings", {
        headers: await toasts.create({
          type: "info",
          title: `Account Linking`,
          description: `Your ${providerName} account is already linked to this profile.`,
        }),
      });
    }
    case "Conflict": {
      return redirect("/settings", {
        headers: await toasts.create({
          type: "error",
          title: `Account Linking Error`,
          description: `The ${providerName} profile you're trying to link is already linked to another user.`,
        }),
      });
    }
    case "Linked": {
      return await login({
        user: result.currentUser,
        redirectToUrl: "/settings",
        headers: await toasts.create({
          type: "success",
          title: `Account Linked`,
          description: `Your ${providerName} account has been linked successfully.`,
        }),
      });
    }
    case "Login": {
      return await login({
        user: result.foundUser,
      });
    }
    case "AutomaticallyLinked": {
      return await login({
        user: result.profileUser,
        headers: await toasts.create({
          type: "info",
          title: "Account Linked",
          description: `Your ${providerName} profile was automatically linked to your existing account.`,
        }),
      });
    }
    case "UserCreated": {
      return await login({
        user: result.newUser,
        headers: await toasts.create({
          type: "success",
          title: "Account Created",
          description: `You can now log in with ${providerName}.`,
        }),
      });
    }
    default: {
      invariant(result, "No match");
    }
  }

  async function login({
    user,
    redirectToUrl,
    headers,
  }: {
    user: User;
    redirectToUrl?: string;
    headers?: Headers;
  }) {
    const redirectTo = await redirectToHelper.flash(request);

    return await authService.login(user, {
      redirectTo: redirectToUrl || redirectTo.url,
      init: {
        headers: combineHeaders(redirectTo.headers, headers),
      },
    });
  }
}

export async function handleProviderCallback(
  session: AuthSession,
  currentUser: User | undefined,
  userService: UserService,
) {
  const existingLogin = await userService.findLogin(
    session.provider,
    session.externalId,
  );

  if (existingLogin && currentUser) {
    if (existingLogin.userId === currentUser.id) {
      return { type: "AlreadyLinked" } as const;
    } else {
      return { type: "Conflict" } as const;
    }
  }

  if (currentUser) {
    await userService.addLogin(makeUserLogin(currentUser.id, session));

    return { type: "Linked", currentUser } as const;
  }

  if (existingLogin) {
    const foundUser = await userService.findById(existingLogin.userId);
    invariant(foundUser, "User not found");

    return { type: "Login", foundUser } as const;
  }

  const profileUser = await userService.findByEmail(session.email);
  if (profileUser) {
    await userService.addLogin(makeUserLogin(profileUser.id, session));

    return { type: "AutomaticallyLinked", profileUser } as const;
  }

  const userId = nanoid();
  const newUser = await userService.create(
    {
      id: userId,
      email: session.email,
    },
    makeUserLogin(userId, session),
  );

  return { type: "UserCreated", newUser } as const;
}

function makeUserLogin(
  userId: string,
  session: AuthSession,
): Omit<UserLogin, "createdAt"> {
  return {
    userId,
    provider: session.provider,
    providerKey: session.externalId,
    providerEmail: session.email,
  };
}
