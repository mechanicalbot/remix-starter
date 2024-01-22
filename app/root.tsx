import { type MetaFunction } from "@remix-run/node";
import {
  Form,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { type LoaderFunctionArgs, json } from "@remix-run/server-runtime";
import { useRef } from "react";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icons,
} from "~/components";
import {
  GeneralErrorBoundary,
  GeneralStatusCodeError,
} from "~/components/ErrorBoundary";
import { authService } from "~/lib/auth/auth.server";
import { useOptionalUser, useUser } from "~/lib/auth/hooks";
import { AuthenticityTokenProvider } from "~/lib/csrf";
import { csrf } from "~/lib/csrf/.server";
import { getPublicEnv } from "~/lib/env.server";
import { HoneypotProvider } from "~/lib/honeypot";
import { honeypot } from "~/lib/honeypot/.server";
import { combineHeaders } from "~/lib/web";

import "./styles/tailwind.css";

export const meta: MetaFunction<typeof loader> = () => [
  { title: "The App" },
  { name: "description", content: "Welcome to The App" },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  return context.time("root#loader", async () => {
    const user = await authService.getUser(request);
    const [csrfToken, csrfCookieHeader] = await csrf.commit();
    const honeyProps = honeypot.getInputProps();

    return json(
      {
        user,
        csrf: csrfToken,
        honeyProps,
        clientIp: context.clientIp,
        ENV: getPublicEnv(),
      },
      {
        headers: combineHeaders(
          csrfCookieHeader ? { "set-cookie": csrfCookieHeader } : null,
        ),
      },
    );
  });
}

const links = [{ to: "/counter", text: "Counter" }] satisfies Array<{
  to: string;
  text: string;
}>;

function App() {
  const data = useLoaderData<typeof loader>();
  const user = useOptionalUser();

  return (
    <Document env={data.ENV}>
      <div className="flex h-screen flex-col">
        <header className="bg-background shadow">
          <nav className="container flex items-center gap-8 px-4 py-4">
            <Link to="/" className="text-xl font-bold">
              <span className="hover:text-primary">The App</span>
            </Link>
            <ul className="flex flex-1 gap-8">
              {links.map(({ to, text }, i) => (
                <li key={i}>
                  <Link to={to} className="font-medium hover:text-primary">
                    {text}
                  </Link>
                </li>
              ))}
            </ul>
            <div>
              {user ? (
                <UserDropdown />
              ) : (
                <Button type="submit" asChild>
                  <Link to="/auth/login">Log in</Link>
                </Button>
              )}
            </div>
          </nav>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </Document>
  );
}

function UserDropdown() {
  const user = useUser();
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Icons.User />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Icons.Settings className="mr-1.5 h-4 w-4" /> Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          onSelect={(e) => {
            e.preventDefault();
            submit(formRef.current!);
          }}
        >
          <Form ref={formRef} method="POST" action="/auth/logout">
            <Icons.LogOut className="mr-1.5 h-4 w-4" />
            Log out
          </Form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppWithProviders() {
  const data = useLoaderData<typeof loader>();
  return (
    <AuthenticityTokenProvider token={data.csrf}>
      <HoneypotProvider {...data.honeyProps}>
        <App />
      </HoneypotProvider>
    </AuthenticityTokenProvider>
  );
}

export default AppWithProviders;

function Document({
  children,
  env,
}: {
  children: React.ReactNode;
  env?: Record<string, string>;
}) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return (
    <Document>
      <GeneralErrorBoundary
        statusHandlers={{
          404: () => (
            <GeneralStatusCodeError
              statusCode={404}
              title="Something's missing."
              description="Sorry, we can't find that page. You'll find lots to explore on the home page."
            >
              <Button asChild>
                <Link to="/">Back to Homepage</Link>
              </Button>
            </GeneralStatusCodeError>
          ),
        }}
      />
    </Document>
  );
}
