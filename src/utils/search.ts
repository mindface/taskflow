export type SearchValues = Record<string, string>;

export type SearchSelectors<T> = {
  [field: string]: (item: T) => string | number | undefined;
};

export function filterBySearchValues<T>(
  items: T[],
  values: SearchValues,
  selectors: SearchSelectors<T>,
) {
  const normalizedValues = Object.entries(values).reduce(
    (acc, [key, value]) => {
      const normalized = value.trim().toLowerCase();
      if (normalized) {
        acc[key] = normalized;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  if (Object.keys(normalizedValues).length === 0) {
    return items;
  }

  return items.filter((item) =>
    Object.entries(normalizedValues).every(([key, value]) => {
      const selector = selectors[key];
      if (!selector) {
        return true;
      }
      return String(selector(item) ?? "").toLowerCase().includes(value);
    }),
  );
}
