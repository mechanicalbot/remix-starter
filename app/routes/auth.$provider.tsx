import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";

import { authService } from "~/lib/auth.server";

export async function loader(_: LoaderFunctionArgs) {
  return redirect("/auth/login");
}

export async function action({ params, request }: ActionFunctionArgs) {
  const provider = params.provider!;

  return await authService.authenticate(provider, request);
}
