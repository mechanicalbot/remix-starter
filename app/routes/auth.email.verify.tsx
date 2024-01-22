import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  json,
  redirect,
  type MetaFunction,
} from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { nanoid } from "nanoid";
import { useRef } from "react";

import { Button, Icons, Input, Label, Divider } from "~/components";
import { UserService } from "~/db/services/user.server";
import { authService } from "~/lib/auth/auth.server";
import { LoginProvider } from "~/lib/auth/types";
import { AuthenticityTokenInput } from "~/lib/csrf";
import { csrf } from "~/lib/csrf/.server";
import { HoneypotInputs } from "~/lib/honeypot";
import { honeypot } from "~/lib/honeypot/.server";
import { redirectToHelper } from "~/lib/redirectTo.server";

export const meta: MetaFunction = () => {
  return [{ title: "Verify code" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authService.requireAnonymous(request);

  const flush = await authService.flush(request);
  if (!flush.email) {
    return redirect("/auth/login");
  }

  return json(
    { authError: flush.error },
    {
      headers: flush.headers,
    },
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  await authService.requireAnonymous(request);
  const formData = await request.clone().formData();
  await csrf.validate(formData, request.headers);
  honeypot.validate(formData);

  const url = new URL(request.url);
  const currentPath = url.pathname;

  const profile = await authService.authenticate(LoginProvider.Email, request, {
    failureRedirect: currentPath,
    successRedirect: currentPath,
  });

  const userService = new UserService(context.db);

  const email = profile.email;
  let user = await userService.findByEmail(email);
  if (!user) {
    const userId = nanoid();
    user = await userService.create({
      id: userId,
      email,
    });

    console.log("New user created from code");
  }

  const redirectTo = await redirectToHelper.flush(request);

  return await authService.login(user, {
    redirectTo: redirectTo.url,
    init: {
      headers: redirectTo.headers,
    },
  });
}

export default function Route() {
  const { authError } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 p-4 sm:max-w-sm">
      <div className="flex min-h-[6.5rem] flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          📬 Please check your inbox
        </h1>
        <p className="text-muted-foreground">
          We have sent you an email containing a magic link. Click on the link
          or enter the code below to continue.
        </p>
      </div>

      <div className="grid gap-6">
        <Form method="POST">
          <AuthenticityTokenInput />
          <HoneypotInputs />
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="code">
                Code
              </Label>
              <Input
                id="code"
                className="font-mono !text-xl tracking-widest"
                ref={inputRef}
                placeholder="123456"
                type="text"
                maxLength={6}
                name="code"
                autoComplete="off"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                inputMode="numeric"
                disabled={isLoading}
                required
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length === 6) {
                    (e.target as HTMLInputElement).form?.submit();
                  }
                }}
              />
              <p className="mt-1 min-h-5 text-sm font-medium text-destructive">
                {authError?.message}
              </p>
            </div>
            <Button type="submit" disabled={isLoading}>
              {!!isLoading && <Icons.Loader className={classNames.icon} />}
              Continue
            </Button>
          </div>
        </Form>
        <Divider>or</Divider>
        <Form
          method="POST"
          onSubmit={() => {
            const input = inputRef.current;
            if (input) {
              input.value = "";
            }
          }}
        >
          <AuthenticityTokenInput />
          <HoneypotInputs />
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {!!isLoading && <Icons.Loader className={classNames.icon} />}
            Request new Code
          </Button>
        </Form>
      </div>
    </div>
  );
}

const classNames = {
  icon: "h-5 w-5 mr-2",
};
