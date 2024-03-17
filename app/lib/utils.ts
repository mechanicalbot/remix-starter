type FnToValue<T extends Record<string, () => unknown>> = {
  [K in keyof T]: ReturnType<T[K]>;
};

export function lazyObj<T extends Record<string, () => unknown>>(
  obj: T,
): FnToValue<T> {
  const cache: Record<string, unknown> = {};

  return new Proxy(
    { ...obj },
    {
      get(target, key: string) {
        if (cache[key]) {
          return cache[key];
        }

        const value = target[key]();
        Object.defineProperty(target, key, {
          value,
          writable: false,
          enumerable: true,
        });
        cache[key] = value;
        return value;
      },
    },
  ) as FnToValue<T>;
}
