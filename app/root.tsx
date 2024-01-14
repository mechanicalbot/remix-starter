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
} from "@remix-run/react";
import { type LoaderFunctionArgs, json } from "@remix-run/server-runtime";
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
import { HoneypotProvider } from "remix-utils/honeypot/react";

import { Button } from "~/components";
import {
  GeneralErrorBoundary,
  GeneralStatusCodeError,
} from "~/components/ErrorBoundary";
import { authService } from "~/lib/auth.server";
import { csrf } from "~/lib/csrf.server";
import { getPublicEnv } from "~/lib/env.server";
import { honeypot } from "~/lib/honeypot.server";
import { combineHeaders } from "~/lib/web";

import "./styles/tailwind.css";

export async function loader({ request, context }: LoaderFunctionArgs) {
  return context.time("root#loader", async () => {
    const user = await authService.getUser(request);
    const [csrfToken, csrfCookieHeader] = await csrf.commitToken();
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

  return (
    <Document env={data.ENV}>
      <div className="flex h-screen flex-col">
        <header className="bg-background shadow">
          <nav className="container flex items-center gap-8 px-4 py-4">
            <Link to="/" className="text-xl font-bold">
              <span className="hover:text-primary">The App</span>
            </Link>
            {/* TODO: collapse on mobile */}
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
              {data.user ? (
                <Form method="POST" action="/auth/logout">
                  <Button type="submit" variant="outline">
                    Log out
                  </Button>
                </Form>
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
