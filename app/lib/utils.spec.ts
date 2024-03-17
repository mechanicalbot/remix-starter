import { describe, expect, it, vi } from "vitest";

import { lazyObj } from "./utils";

describe(lazyObj.name, () => {
  it("should call the function once when the property is accessed", () => {
    const obj = {
      a: vi.fn(() => 1),
      b: () => 2,
    };
    const result = lazyObj(obj);

    expect(Object.keys(result)).toEqual(["a", "b"]);
    expect(obj.a).not.toHaveBeenCalled();
    expect(result.a).toBe(1);
    expect(obj.a).toHaveBeenCalledTimes(1);
    expect(result.a).toBe(1);
    expect(obj.a).toHaveBeenCalledTimes(1);
  });
});
