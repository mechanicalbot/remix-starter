import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { nanoid } from "nanoid";

import { UserService } from "~/db/services/user.server";
import { authService } from "~/lib/auth.server";

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
  const profile = await authService.authenticate(params.provider!, request, {
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
      return redirect("/");
    } else {
      console.log("Already authenticated. Connected to another account");
      return redirect("/");
    }
  }

  if (currentUser) {
    await userService.addLogin({
      userId: currentUser.id,
      provider: profile.provider,
      providerKey: profile.externalId,
      providerEmail: profile.email,
    });

    console.log("Already authenticated. Connected. Re-authenticated");
    return await authService.login(currentUser);
  }

  if (existingLogin) {
    const user = await userService.findById(existingLogin.userId);
    if (!user) {
      throw Error("User not found");
    }

    console.log("Login existing connection");
    return await authService.login(user);
  }

  const profileUser = await userService.findByEmail(profile.email);
  if (profileUser) {
    await userService.addLogin({
      userId: profileUser.id,
      provider: profile.provider,
      providerKey: profile.externalId,
      providerEmail: profile.email,
    });

    console.log("Connected");
    return await authService.login(profileUser);
  }

  const userId = nanoid();
  const newUser = await userService.create(
    {
      id: userId,
      email: profile.email,
    },
    {
      userId,
      provider: profile.provider,
      providerKey: profile.externalId,
      providerEmail: profile.email,
    },
  );

  console.log("New user created");
  return await authService.login(newUser);
}
