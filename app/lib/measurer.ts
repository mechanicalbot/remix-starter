export class Measurer {
  readonly #measures = new Set<{
    name: string;
    duration: number;
  }>();

  time = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = Date.now();

    try {
      return await fn();
    } finally {
      const end = Date.now();
      const duration = end - start;
      this.#measures.add({ name, duration });
    }
  };

  toHeaders = (headers = new Headers()) => {
    for (const { name, duration } of this.#measures) {
      const encodedName = name.includes("/") ? encodeURIComponent(name) : name;
      headers.append("Server-Timing", `${encodedName};dur=${duration}`);
    }

    return headers;
  };
}
