import { z } from "zod";

export const EnvSchema = z.object({
  COOKIE_SECRET: z.string(),
  TOTP_SECRET: z.string(),
  HONEYPOT_SECRET: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  FACEBOOK_CLIENT_ID: z.string(),
  FACEBOOK_CLIENT_SECRET: z.string(),
});

export type Env = z.infer<typeof EnvSchema>;

export function getPublicEnv(_env: Env) {
  return {};
}

export type PublicEnv = ReturnType<typeof getPublicEnv>;

declare global {
  const ENV: PublicEnv;
  interface Window {
    ENV: PublicEnv;
  }
}
