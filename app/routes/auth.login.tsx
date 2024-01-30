import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";

import { Input, Label, Divider } from "~/components";
import { authService } from "~/lib/auth/auth.server";
import {
  socialLoginProviders,
  loginProviderDescriptors,
  LoginProviderForm,
  LoginProviderButton,
} from "~/lib/auth/loginProviders";
import { LoginProvider } from "~/lib/auth/types";
import { HoneypotInputs } from "~/lib/honeypot";
import { honeypot } from "~/lib/honeypot/.server";
import { redirectToHelper } from "~/lib/redirectTo.server";
import { combineHeaders } from "~/lib/web";

export const meta: MetaFunction = () => {
  return [{ title: "Log in" }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authService.requireAnonymous(request);
  const flushError = await authService.flush(request);

  return json(
    { authError: flushError.error },
    {
      headers: combineHeaders(
        flushError.headers,
        await redirectToHelper.toHeaders(request),
      ),
    },
  );
}

export async function action({ request }: ActionFunctionArgs) {
  await authService.requireAnonymous(request);
  const formData = await request.clone().formData();
  honeypot.validate(formData);
  await authService.authenticate(LoginProvider.Email, request, {
    successRedirect: "/auth/email/verify",
    failureRedirect: "/auth/login",
  });

  return json({});
}

export default function Route() {
  const { authError } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.formAction === "/auth/login";

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
                required
              />
              <p className="mt-1 min-h-5 text-sm font-medium text-destructive">
                {authError?.message}
              </p>
            </div>
            <LoginProviderButton
              type="Continue"
              isLoading={isLoading}
              variant="default"
              descriptor={loginProviderDescriptors[LoginProvider.Email]}
            />
          </div>
        </Form>
        <Divider>or</Divider>
        <div className="flex flex-col gap-2">
          {socialLoginProviders.map((provider) => {
            const descriptor = loginProviderDescriptors[provider];

            return (
              <LoginProviderForm
                type="Continue"
                key={descriptor.type}
                descriptor={descriptor}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
