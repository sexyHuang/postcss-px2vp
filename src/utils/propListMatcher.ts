import { createPropValidator } from './propListFilter';

const matcherMap = new Map<string, (prop: string) => boolean>();
function _createPropListMatcher(propList: string[]) {
  const propValidator = createPropValidator(propList);
  return function (prop: string) {
    if (propValidator.matchAll) return true;
    return (
      (propValidator.hasWild ||
        propValidator.exact(prop) ||
        propValidator.contain(prop) ||
        propValidator.startWith(prop) ||
        propValidator.endWith(prop)) &&
      propValidator.notExact(prop) &&
      propValidator.notContain(prop) &&
      propValidator.notStartWith(prop) &&
      propValidator.notEndWith(prop)
    );
  };
}

export function createPropListMatcher(propList: string[]) {
  const key = propList.join(',');
  if (!matcherMap.has(key))
    matcherMap.set(key, _createPropListMatcher(propList));
  return matcherMap.get(key)!;
}
