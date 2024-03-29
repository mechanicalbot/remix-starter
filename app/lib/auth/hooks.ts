import { type SerializeFrom } from "@remix-run/node";
import { useRouteLoaderData } from "@remix-run/react";

import { invariant } from "~/lib/invariant";
import { type loader as rootLoader } from "~/root";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isUser(user: any): user is SerializeFrom<typeof rootLoader>["user"] {
  return user && typeof user === "object" && typeof user.id === "string";
}

export function useOptionalUser() {
  const data = useRouteLoaderData<typeof rootLoader>("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser() {
  const user = useOptionalUser();
  invariant(
    user,
    "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.",
  );

  return user;
}
