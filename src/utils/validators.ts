export const isExclude = (exclude: RegExp | RegExp[], file?: string) => {
  if (!file) return false;
  if (Array.isArray(exclude)) return exclude.some(reg => reg.test(file));
  return exclude.test(file);
};

export const blacklistedSelector = (
  blacklist: (string | RegExp)[],
  selector: string
) =>
  blacklist.some(rule => {
    if (typeof rule === 'string') return selector.includes(rule);
    return rule.test(selector);
  });
