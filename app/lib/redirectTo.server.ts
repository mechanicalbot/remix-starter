import { createCookie } from "@remix-run/node";

const redirectCookie = createCookie("redirectTo", {
  path: "/",
  maxAge: 60 * 10,
});

class RedirectTo {
  toSearchString(urlString: string) {
    const url = new URL(urlString);
    const redirectTo = url.pathname + url.search;

    return `redirectTo=${encodeURIComponent(redirectTo)}`;
  }

  async toHeaders(request: Request, headers = new Headers()) {
    const url = new URL(request.url);
    const redirectTo = url.searchParams.get("redirectTo");
    headers.append("Set-Cookie", await redirectCookie.serialize(redirectTo));

    return headers;
  }

  async flush(request: Request) {
    const url: string | null = await redirectCookie.parse(
      request.headers.get("Cookie"),
    );

    return {
      url,
      headers: new Headers([
        ["Set-Cookie", await redirectCookie.serialize(null, { maxAge: -1 })],
      ]),
    };
  }
}

export const redirectToHelper = new RedirectTo();
