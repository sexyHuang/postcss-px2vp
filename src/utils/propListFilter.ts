type CreateFilterPayloads = [
  match: RegExp,
  ...slicePayload: Parameters<String['slice']>
];

const createFilter =
  (...[match, ...slicePayload]: CreateFilterPayloads) =>
  (list: string[]) =>
    list
      .filter(prop => prop.match(match))
      .map(prop => prop.slice(...slicePayload));

const filterMap = {
  exact: createFilter(/^[^\*\!]+$/),
  contain: createFilter(/^\*.+\*$/, 1, -1),
  endWith: createFilter(/^\*[^\*]+$/, 1),
  startWith: createFilter(/^[^\*\!]+\*$/, 0, -1),
  notExact: createFilter(/^\![^\*].*$/, 1),
  notContain: createFilter(/^\!\*.+\*$/, 2, -1),
  notEndWith: createFilter(/^\!\*[^\*]+$/, 2),
  notStartWith: createFilter(/^\![^\*]+\*$/, 1, -1)
};

interface Validator {
  (this: string[], prop: string): boolean;
}
type Key = keyof typeof filterMap;
const keys = new Set(Object.keys(filterMap));
const validators: Record<Key, Validator> = {
  exact(prop) {
    return this.includes(prop);
  },
  contain(prop) {
    return this.some(m => prop.includes(m));
  },
  startWith(prop) {
    return this.some(m => prop.indexOf(m) === 0);
  },
  endWith(prop) {
    return this.some(m => prop.indexOf(m) === prop.length - m.length);
  },
  notExact(prop) {
    return !validators.exact.call(this, prop);
  },
  notContain(prop) {
    return !validators.contain.call(this, prop);
  },
  notStartWith(prop) {
    return !validators.startWith.call(this, prop);
  },
  notEndWith(prop) {
    return !validators.endWith.call(this, prop);
  }
};

type FilterResultMap = Record<Key, string[]>;

function curryFilterMap(propList: string[]): FilterResultMap {
  const res: any = {};
  for (const [key, value] of Object.entries(filterMap)) {
    res[key] = value(propList);
  }
  return res;
}

class PropValidator {
  filterMatchMap: FilterResultMap;
  private propList: string[];
  constructor(propList: string[]) {
    this.filterMatchMap = curryFilterMap(propList);
    this.propList = propList;
  }
  get hasWild() {
    return this.propList.includes('*');
  }
  get matchAll() {
    return this.hasWild && this.propList.length === 1;
  }
}

export function createPropValidator(propList: string[]) {
  const pValidator = new PropValidator(propList);
  return new Proxy(pValidator, {
    get(target, key) {
      if (key in target) {
        return target[key];
      } else if (typeof key === 'string' && keys.has(key)) {
        return validators[key as Key].bind(target.filterMatchMap[key]);
      } else {
        throw new ReferenceError(`Prop name ${String(key)} does not exist.`);
      }
    }
  }) as PropValidator & Record<Key, (prop: string) => boolean>;
}
