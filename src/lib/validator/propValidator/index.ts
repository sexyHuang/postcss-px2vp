import { dropRepeats } from 'ramda';
import { createPropValidator } from './propListFilter';

const validatorMap = new Map<string, (prop: string) => boolean>();
function createPropAllRuleValidator(propList: string[]) {
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

export function getPropValidator(propList: string[]) {
  const key = dropRepeats(propList.sort()).join(',');
  if (!validatorMap.has(key))
    validatorMap.set(key, createPropAllRuleValidator(propList));
  return validatorMap.get(key)!;
}
