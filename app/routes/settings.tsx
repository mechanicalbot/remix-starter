import {
  type LoaderFunctionArgs,
  json,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";

import { Button, Divider, Icons, Input, Label } from "~/components";
import { UserService } from "~/db/services/user.server";
import { AuthService } from "~/lib/auth/auth.server";
import {
  LoginProviderForm,
  loginProviderDescriptors,
  socialLoginProviders,
} from "~/lib/auth/loginProviders";
import { invariant } from "~/lib/invariant";

export const meta: MetaFunction<typeof loader> = () => [
  {
    title: "Settings",
  },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const authService = new AuthService(context);
  const userService = new UserService(context);

  const session = await authService.requireUser(request);
  const [user, logins] = await Promise.all([
    userService.findById(session.id),
    userService.getLogins(session.id),
  ]);

  invariant(user, "User not found");

  return json({
    user,
    logins,
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const authService = new AuthService(context);
  const userService = new UserService(context);

  const session = await authService.requireUser(request);
  const formData = await request.formData();

  await userService.removeLogin(
    session.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.get("provider") as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.get("providerKey") as any,
  );

  return json({});
}

export default function Profile() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  return (
    <div className="container my-8 max-w-screen-sm">
      <Section
        title={
          <>
            <Icons.User className="mr-2 h-4 w-4" />
            Profile
          </>
        }
      >
        <Form>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            className="mt-2"
            disabled
            value={data.user.email}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
          />
        </Form>
      </Section>
      <Divider className="my-4" />
      <Section
        title={
          <>
            <Icons.Link className="mr-2 h-4 w-4" />
            Linked profiles
          </>
        }
      >
        {!data.logins.length ? (
          <p>You don&apos;t have any linked profiles yet.</p>
        ) : (
          <ul className="space-y-4">
            {data.logins.map((login) => {
              const descriptor = loginProviderDescriptors[login.provider];

              return (
                <li key={login.provider + login.providerKey}>
                  <Form method="POST" className="flex items-center gap-2">
                    <descriptor.icon className="h-5 w-5" />
                    <div className="flex-1 overflow-x-hidden text-ellipsis">
                      {login.providerEmail}
                      <time
                        suppressHydrationWarning
                        className="min-h block whitespace-pre-wrap text-xs text-muted-foreground"
                      >
                        {new Date(login.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      variant="destructive"
                      disabled={isLoading}
                      title="Unlink"
                    >
                      <Icons.Unlink className="h-4 w-4" />
                    </Button>
                    <input
                      type="hidden"
                      name="provider"
                      value={login.provider}
                    />
                    <input
                      type="hidden"
                      name="providerKey"
                      value={login.providerKey}
                    />
                  </Form>
                </li>
              );
            })}
          </ul>
        )}
        <Divider className="my-4" />
        <div className="flex flex-wrap justify-evenly gap-2">
          {socialLoginProviders.map((provider) => {
            const descriptor = loginProviderDescriptors[provider];

            return (
              <LoginProviderForm
                key={descriptor.type}
                descriptor={descriptor}
                type="Link"
              />
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-3">
      <h2 className="flex items-center text-xl font-semibold">{title}</h2>
      <div className="overflow-x-visible sm:col-span-2">{children}</div>
    </div>
  );
}
