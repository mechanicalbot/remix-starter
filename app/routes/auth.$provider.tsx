import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";

import { AuthService } from "~/lib/auth/auth.server";
import { LoginProviderSchema } from "~/lib/auth/types";

export async function loader(_: LoaderFunctionArgs) {
  return redirect("/auth/login");
}

export async function action({ params, request, context }: ActionFunctionArgs) {
  const authService = new AuthService(context);

  const provider = LoginProviderSchema.parse(params.provider);

  return await authService.authenticate(provider, request);
}
