import { AppLoadContext } from "@remix-run/node";
import {
  Honeypot as RemixHoneypot,
  SpamError,
} from "remix-utils/honeypot/server";

export class Honeypot {
  #honeypot: RemixHoneypot;

  constructor(context: AppLoadContext) {
    this.#honeypot = new RemixHoneypot({
      encryptionSeed: context.env.HONEYPOT_SECRET,
    });
  }

  getInputProps() {
    return this.#honeypot.getInputProps();
  }

  validate(formData: FormData) {
    try {
      this.#honeypot.check(formData);
    } catch (error) {
      if (error instanceof SpamError) {
        throw new Response("Form not submitted properly", { status: 400 });
      }
      throw error;
    }
  }
}
