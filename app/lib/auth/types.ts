import { z } from "zod";

export interface UserSession {
  id: string;
  email: string;
}

export enum LoginProvider {
  Email = "email",
  Google = "google",
  GitHub = "github",
}

export const LoginProviderSchema = z.nativeEnum(LoginProvider);
