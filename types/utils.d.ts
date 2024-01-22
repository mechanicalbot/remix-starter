type AllPermutations<T extends string | number> = [T] extends [never]
  ? []
  : {
      [K in T]: [K, ...AllPermutations<Exclude<T, K>>];
    }[T];
