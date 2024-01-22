import { z } from "zod";

export interface UserSession {
  id: string;
  email: string;
}

export enum LoginProvider {
  Email = "email",
  GitHub = "github",
}

export const LoginProviderSchema = z.nativeEnum(LoginProvider);
