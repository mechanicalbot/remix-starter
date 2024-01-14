import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { HoneypotInputs } from "remix-utils/honeypot/react";

import { Button, Input, Label, Icons, Divider } from "~/components";
import { authService } from "~/lib/auth.server";
import { validateCSRF } from "~/lib/csrf.server";
import { checkHoneypot } from "~/lib/honeypot.server";

export const meta: MetaFunction = () => {
  return [{ title: "Log in" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authService.requireAnonymous(request);
  const flushError = await authService.flushSession(request);

  return json(
    { authError: flushError.error },
    {
      headers: flushError.headers,
    },
  );
}

export async function action({ request }: ActionFunctionArgs) {
  await authService.requireAnonymous(request);
  const formData = await request.clone().formData();
  await validateCSRF(formData, request.headers);
  checkHoneypot(formData);
  await authService.authenticate("email", request, {
    successRedirect: "/auth/email/verify",
    failureRedirect: "/auth/login",
  });

  return json({});
}

export default function Route() {
  const { authError } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const isLoading = navigation.state === "submitting";

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 p-4 sm:max-w-sm">
      <div className="flex min-h-[6.5rem] flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          👋 Welcome back
        </h1>
        <p className="text-muted-foreground">
          Enter your email address, and we will send a magic link to your inbox.
        </p>
      </div>
      <div className="grid gap-6">
        <Form method="POST">
          <AuthenticityTokenInput />
          <HoneypotInputs />
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="email-input">
                Email
              </Label>
              <Input
                id="email-input"
                placeholder="name@example.com"
                type="email"
                name="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                required
              />
              <p className="mt-1 min-h-5 text-sm font-medium text-destructive">
                {authError?.message}
              </p>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Icons.Loader className={classNames.icon} />
              ) : (
                <Icons.Mail className={classNames.icon} />
              )}
              Continue with Email
            </Button>
          </div>
        </Form>
        <Divider>or</Divider>
        <div className="flex flex-col gap-2">
          {providers.map(({ name, action, icon }) => (
            <Form key={name} method="POST" action={action} className="contents">
              <Button type="submit" variant="outline" disabled={isLoading}>
                {isLoading ? (
                  <Icons.Loader className={classNames.icon} />
                ) : (
                  icon
                )}
                <span className="text-left">Continue with {name}</span>
              </Button>
            </Form>
          ))}
        </div>
      </div>
    </div>
  );
}

const classNames = {
  icon: "h-5 w-5 mr-2",
};

const providers = [
  {
    name: "Google",
    icon: <Icons.Google className={classNames.icon} />,
    action: "/auth/google",
  },
  {
    name: "Apple",
    icon: <Icons.Apple className={classNames.icon} />,
    action: "/auth/apple",
  },
  {
    name: "Twitter",
    icon: <Icons.Twitter className={classNames.icon} />,
    action: "/auth/twitter",
  },
  {
    name: "GitHub",
    icon: <Icons.GitHub className={classNames.icon} />,
    action: "/auth/github",
  },
] satisfies ReadonlyArray<{
  name: string;
  icon: React.ReactNode;
  action: string;
}>;
