import {
  type AppLoadContext,
  type SessionStorage,
  createCookieSessionStorage,
} from "@remix-run/node";

import { type ToastInput, ToastSchema } from "~/components";

const toastKey = "toast";

export class Toasts {
  #sessionStorage: SessionStorage;

  constructor(context: AppLoadContext) {
    this.#sessionStorage = createCookieSessionStorage({
      cookie: {
        name: "en_toast",
        sameSite: "lax",
        path: "/",
        httpOnly: true,
        secrets: context.env.COOKIE_SECRET,
        secure: process.env.NODE_ENV === "production",
      },
    });
  }

  async create(toastInput: ToastInput) {
    const session = await this.#sessionStorage.getSession();
    const toast = ToastSchema.parse(toastInput);
    session.flash(toastKey, toast);
    const cookie = await this.#sessionStorage.commitSession(session);
    return new Headers({ "set-cookie": cookie });
  }

  async get(request: Request) {
    const session = await this.#sessionStorage.getSession(
      request.headers.get("cookie"),
    );
    const result = ToastSchema.safeParse(session.get(toastKey));
    const toast = result.success ? result.data : null;

    return {
      toast,
      headers:
        toast &&
        new Headers({
          "set-cookie": await this.#sessionStorage.destroySession(session),
        }),
    };
  }
}
