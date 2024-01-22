import {
  json,
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

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

export async function action(_: ActionFunctionArgs) {
  await db.increment();
  return redirect("/counter");
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
