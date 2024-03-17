import { type AppLoadContext } from "@remix-run/server-runtime";
import { createRemixStub } from "@remix-run/testing";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test } from "vitest";

import Counter, { action, loader } from "./counter";

test("counter increments when clicked", async () => {
  const App = createRemixStub(
    [
      {
        path: "/counter",
        Component: Counter,
        loader,
        action,
      },
    ],
    {
      env: { COOKIE_SECRET: ["secret"] },
    } as AppLoadContext,
  );
  await render(<App initialEntries={["/counter"]} />);
  const button = await waitFor(() =>
    screen.findByRole("button", { name: /count:/i }),
  );
  expect(button).toHaveTextContent("Count: 0");
  await userEvent.click(button);
  await waitFor(() => expect(button).toHaveTextContent("Count: 1"));
});
