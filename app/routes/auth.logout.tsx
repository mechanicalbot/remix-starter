import { type ActionFunctionArgs } from "@remix-run/server-runtime";

import { authService } from "~/lib/auth.server";

export async function action(_: ActionFunctionArgs) {
  await authService.logout();
}
