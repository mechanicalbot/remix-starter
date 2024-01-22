import {
  Honeypot as RemixHoneypot,
  SpamError,
} from "remix-utils/honeypot/server";

const remixHoneypot = new RemixHoneypot({
  validFromFieldName: process.env.TESTING ? null : undefined,
  encryptionSeed: process.env.HONEYPOT_SECRET,
});

class Honeypot {
  getInputProps() {
    return remixHoneypot.getInputProps();
  }

  validate(formData: FormData) {
    try {
      remixHoneypot.check(formData);
    } catch (error) {
      if (error instanceof SpamError) {
        throw new Response("Form not submitted properly", { status: 400 });
      }
      throw error;
    }
  }
}

export const honeypot = new Honeypot();
