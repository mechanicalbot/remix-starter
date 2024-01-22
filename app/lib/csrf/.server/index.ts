import { createCookie } from "@remix-run/node";
import { CSRF as RemixCSRF, CSRFError } from "remix-utils/csrf/server";

const cookie = createCookie("csrf", {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  secrets: process.env.COOKIE_SECRET.split(","),
});

const remixCsrf = new RemixCSRF({ cookie });

class CSRF {
  commit() {
    return remixCsrf.commitToken();
  }

  async validate(formData: FormData, headers: Headers) {
    try {
      await remixCsrf.validate(formData, headers);
    } catch (error) {
      if (error instanceof CSRFError) {
        throw new Response("Invalid CSRF token", { status: 403 });
      }
      throw error;
    }
  }
}

export const csrf = new CSRF();
