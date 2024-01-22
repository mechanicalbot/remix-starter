import { Form, useNavigation } from "@remix-run/react";

import { Button, type ButtonProps, Icons } from "~/components";

import { LoginProvider } from "./types";

const loginProviders = Object.values(LoginProvider);
export const socialLoginProviders = loginProviders.filter(
  (x) => x !== LoginProvider.Email,
);

export type LoginProviderDescriptor = {
  type: LoginProvider;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  skipCreation?: boolean;
};

export const loginProviderDescriptors: Record<
  LoginProvider,
  LoginProviderDescriptor
> = {
  [LoginProvider.Email]: {
    type: LoginProvider.Email,
    name: "Email",
    icon: Icons.Mail,
  },
  [LoginProvider.GitHub]: {
    type: LoginProvider.GitHub,
    name: "GitHub",
    icon: Icons.GitHub,
  },
  //   [LoginProvider.Google]: {
  //     type: LoginProvider.Google,
  //     name: "Google",
  //     icon: Icons.Google,
  //   },
  //   [LoginProvider.Apple]: {
  //     type: LoginProvider.Apple,
  //     name: "Apple",
  //     icon: Icons.Apple,
  //   },
  //   [LoginProvider.Twitter]: {
  //     type: LoginProvider.Twitter,
  //     name: "Twitter",
  //     icon: Icons.Twitter,
  //   },
};

export function LoginProviderForm({
  descriptor,
  type,
}: {
  descriptor: LoginProviderDescriptor;
  type: "Link" | "Continue";
}) {
  const navigation = useNavigation();
  const action = `/auth/${descriptor.type}`;
  const isLoading = navigation.formAction === action;

  return (
    <Form
      key={descriptor.type}
      method="POST"
      action={action}
      className="contents"
    >
      <LoginProviderButton
        isLoading={isLoading}
        variant="outline"
        descriptor={descriptor}
        type={type}
      />
    </Form>
  );
}

export function LoginProviderButton({
  variant,
  isLoading,
  descriptor,
  type,
}: {
  variant: ButtonProps["variant"];
  isLoading: boolean;
  descriptor: LoginProviderDescriptor;
  type: "Link" | "Continue";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <Icons.Loader className="mr-2 h-5 w-5" />
      ) : (
        <descriptor.icon className="mr-2 h-5 w-5" />
      )}
      <span className="text-left">
        {type} with {descriptor.name}
      </span>
    </Button>
  );
}
