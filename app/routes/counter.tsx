import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { Toasts } from "~/lib/toasts.server";

const db = {
  _count: 0,
  async getCount() {
    return this._count;
  },
  async increment() {
    this._count++;
  },
};

export async function loader(_: LoaderFunctionArgs) {
  return json({ count: await db.getCount() });
}

export async function action({ context }: ActionFunctionArgs) {
  await db.increment();
  const toasts = new Toasts(context);

  return redirect("/counter", {
    headers: await toasts.create({
      title: `Incremented to ${await db.getCount()}`,
    }),
  });
}

export default function Counter() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="m-8">
      <Form method="post">
        <button
          className="rounded-md bg-red-500 px-4 py-2 text-white"
          type="submit"
        >
          Count: {data.count}
        </button>
      </Form>
    </div>
  );
}
