import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { nanoid } from "nanoid";

import {
  type User,
  UserService,
  type UserLogin,
} from "~/db/services/user.server";
import { AuthService, type AuthSession } from "~/lib/auth/auth.server";
import { LoginProviderSchema } from "~/lib/auth/types";
import { invariant } from "~/lib/invariant";
import { redirectToHelper } from "~/lib/redirectTo.server";

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

  const provider = LoginProviderSchema.parse(params.provider);
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
    case "LoginMatchedUser": {
      console.log("Already authenticated. Already connected");
      return redirect("/settings");
    }
    case "LoginLinkedToOtherUser": {
      console.log("Already authenticated. Connected to another account");
      // TODO: error
      return redirect("/settings");
    }
    case "AddedLoginForUser": {
      console.log("Already authenticated. Connected. Re-authenticated");
      return await login(result.currentUser, "/settings");
    }
    case "LoginWithoutUser": {
      console.log("Login existing connection");
      return await login(result.foundUser);
    }
    case "FoundUserProfile": {
      console.log("Connected");
      return await login(result.profileUser);
    }
    case "CreatedNewUser": {
      console.log("New user created");
      return await login(result.newUser);
    }
    default: {
      invariant(result, "No match");
    }
  }

  async function login(user: User, redirectToUrl?: string) {
    const redirectTo = await redirectToHelper.flash(request);

    return await authService.login(user, {
      redirectTo: redirectToUrl || redirectTo.url,
      init: {
        headers: redirectTo.headers,
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
      return { type: "LoginMatchedUser" } as const;
    } else {
      return { type: "LoginLinkedToOtherUser" } as const;
    }
  }

  if (currentUser) {
    await userService.addLogin(makeUserLogin(currentUser.id, session));

    return { type: "AddedLoginForUser", currentUser } as const;
  }

  if (existingLogin) {
    const foundUser = await userService.findById(existingLogin.userId);
    invariant(foundUser, "User not found");

    return { type: "LoginWithoutUser", foundUser } as const;
  }

  const profileUser = await userService.findByEmail(session.email);
  if (profileUser) {
    await userService.addLogin(makeUserLogin(profileUser.id, session));

    return { type: "FoundUserProfile", profileUser } as const;
  }

  const userId = nanoid();
  const newUser = await userService.create(
    {
      id: userId,
      email: session.email,
    },
    makeUserLogin(userId, session),
  );

  return { type: "CreatedNewUser", newUser } as const;
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
