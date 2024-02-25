import { type ActionFunctionArgs } from "@remix-run/node";

import { AuthService } from "~/lib/auth/auth.server";

export async function action({ context }: ActionFunctionArgs) {
  const authService = new AuthService(context);

  return await authService.logout();
}
