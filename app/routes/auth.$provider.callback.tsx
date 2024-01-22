import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { nanoid } from "nanoid";

import { type User, UserService } from "~/db/services/user.server";
import { authService } from "~/lib/auth/auth.server";
import { loginProviderDescriptors } from "~/lib/auth/loginProviders";
import { LoginProviderSchema } from "~/lib/auth/types";
import { redirectToHelper } from "~/lib/redirectTo.server";

async function getUser(request: Request, userService: UserService) {
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
  const provider = LoginProviderSchema.parse(params.provider);
  const profile = await authService.authenticate(provider, request, {
    failureRedirect: "/auth/login",
  });

  const userService = new UserService(context.db);
  const currentUser = await getUser(request, userService);
  const existingLogin = await userService.findLogin(
    profile.provider,
    profile.externalId,
  );

  if (existingLogin && currentUser) {
    if (existingLogin.userId === currentUser.id) {
      console.log("Already authenticated. Already connected");
      return redirect("/settings");
    } else {
      console.log("Already authenticated. Connected to another account");
      // TODO: error
      return redirect("/settings");
    }
  }

  if (currentUser) {
    if (!loginProviderDescriptors[profile.provider].skipCreation) {
      await userService.addLogin({
        userId: currentUser.id,
        provider: profile.provider,
        providerKey: profile.externalId,
        providerEmail: profile.email,
      });
    }

    console.log("Already authenticated. Connected. Re-authenticated");
    return await login(currentUser, "/settings");
  }

  if (existingLogin) {
    const user = await userService.findById(existingLogin.userId);
    if (!user) {
      throw Error("User not found");
    }

    console.log("Login existing connection");
    return await login(user);
  }

  const profileUser = await userService.findByEmail(profile.email);
  if (profileUser) {
    if (!loginProviderDescriptors[profile.provider].skipCreation) {
      await userService.addLogin({
        userId: profileUser.id,
        provider: profile.provider,
        providerKey: profile.externalId,
        providerEmail: profile.email,
      });
    }

    console.log("Connected");
    return await login(profileUser);
  }

  const userId = nanoid();
  const newUser = await userService.create(
    {
      id: userId,
      email: profile.email,
    },
    loginProviderDescriptors[profile.provider].skipCreation
      ? undefined
      : {
          userId,
          provider: profile.provider,
          providerKey: profile.externalId,
          providerEmail: profile.email,
        },
  );

  console.log("New user created");
  return await login(newUser);

  async function login(user: User, redirectToUrl?: string) {
    const redirectTo = await redirectToHelper.flush(request);

    return await authService.login(user, {
      redirectTo: redirectToUrl || redirectTo.url,
      init: {
        headers: redirectTo.headers,
      },
    });
  }
}
