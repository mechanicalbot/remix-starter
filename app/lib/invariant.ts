export class InvariantError extends Error {}

export function invariant(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new InvariantError(message);
  }
}

export function invariantResponse(
  condition: unknown,
  message: string,
  responseInit?: ResponseInit,
): asserts condition {
  if (!condition) {
    throw new Response(message, {
      status: 400,
      ...responseInit,
    });
  }
}
