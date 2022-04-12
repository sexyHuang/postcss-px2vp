import type { Container, Declaration, PluginCreator, Rule } from 'postcss';
import {
  IGNORE_NEXT_COMMENT,
  IGNORE_PREV_COMMENT,
  POSTCSS_PLUGIN
} from './const';

import type { InputType, Option, ViewportUnit } from './type';
import getUnitRegexp from './utils/getUnitRegexp';
import { createPropListMatcher } from './utils/propListMatcher';

const getDefault = () =>
  ({
    unitToConvert: 'px',
    viewportWidth: 320,
    viewportHeight: 568, // not now used; TODO: need for different units and math for different properties
    unitPrecision: 5,
    viewportUnit: 'vw',
    fontViewportUnit: 'vw', // vmin is more suitable.
    selectorBlackList: [],
    propList: ['*'],
    minPixelValue: 1,
    mediaQuery: false,
    replace: true,
    landscape: false,
    landscapeUnit: 'vw',
    exclude: [],
    landscapeWidth: 568
  } as Required<Option>);

const isExclude = (exclude: RegExp | RegExp[], file?: string) => {
  if (!file) return false;
  if (Array.isArray(exclude)) return exclude.some(reg => reg.test(file));
  return exclude.test(file);
};

function getOption<T>(
  option: T,
  rule: Rule
): T extends (rule: Rule) => infer K ? K : T {
  return typeof option === 'function' ? option(rule) : option;
}

function toFixed(number: number, precision: number) {
  const multiplier = Math.pow(10, precision + 1),
    wholeNumber = Math.floor(number * multiplier);
  return (Math.round(wholeNumber / 10) * 10) / multiplier;
}

function createPxReplace(
  opts: { minPixelValue: number; unitPrecision: number },
  viewportUnit: ViewportUnit,
  viewportSize: number
) {
  return function (m: string, $1: string) {
    if (!$1) return m;
    const pixels = parseFloat($1);
    if (pixels <= opts.minPixelValue) return m;
    const parsedVal = toFixed(
      (pixels / viewportSize) * 100,
      opts.unitPrecision
    );
    return parsedVal === 0 ? '0' : `${parsedVal}${viewportUnit}`;
  };
}

function validateParams(params: undefined | string, mediaQuery: boolean) {
  return !params || (params && mediaQuery);
}

function getUnit(
  prop: string,
  opts: { viewportUnit: ViewportUnit; fontViewportUnit: ViewportUnit }
) {
  return !prop.includes('font') ? opts.viewportUnit : opts.fontViewportUnit;
}

function declarationExists(
  decls: Container | undefined,
  prop: string,
  value: string
) {
  if (!decls) return false;
  return decls.some(function (decl: Declaration) {
    return decl.prop === prop && decl.value === value;
  });
}

function optionCreator({
  options,
  rule,
  defaultOptions
}: {
  options?: InputType;
  rule: Rule;
  defaultOptions: Required<Option>;
}): Required<Option> {
  if (!options) return defaultOptions;
  return {
    ...defaultOptions,
    ...Object.entries(options).reduce((prev, [key, value]) => {
      prev[key] = getOption(value, rule);
      return prev;
    }, {} as any)
  };
}

const blacklistedSelector = (
  blacklist: (string | RegExp)[],
  selector: string
) =>
  blacklist.some(rule => {
    if (typeof rule === 'string') return selector.includes(rule);
    return rule.test(selector);
  });

const px2vp: PluginCreator<InputType> = options => {
  const landscapeRules: Rule[] = [];
  const defaultOptions = getDefault();

  return {
    postcssPlugin: POSTCSS_PLUGIN,
    Once(root, { atRule, result }) {
      root.walkRules(rule => {
        const file = rule.source?.input.file;

        const {
          exclude,
          selectorBlackList,
          propList,
          landscape,
          unitToConvert,
          minPixelValue,
          unitPrecision,
          landscapeUnit,
          landscapeWidth,
          fontViewportUnit,
          viewportUnit,
          mediaQuery,
          viewportWidth,
          replace
        } = optionCreator({ options, rule, defaultOptions });
        // init options
        const pxRegex = getUnitRegexp(unitToConvert);
        const satisfyPropList = createPropListMatcher(propList);
        const params = (rule.parent as any)?.params as string | undefined;
        if (
          isExclude(exclude, file) ||
          blacklistedSelector(selectorBlackList, rule.selector)
        )
          return;

        if (landscape && !params) {
          const landscapeRule = rule.clone().removeAll();
          rule.walkDecls(decl => {
            const { value, prop } = decl;
            if (!value.includes(unitToConvert) || !satisfyPropList(prop))
              return;

            landscapeRule.append(
              decl.clone({
                value: value.replace(
                  pxRegex,
                  createPxReplace(
                    { minPixelValue, unitPrecision },
                    landscapeUnit,
                    landscapeWidth
                  )
                )
              })
            );
            if (landscapeRule.nodes.length > 0) {
              landscapeRules.push(landscapeRule);
            }
          });
        }
        if (!validateParams(params, mediaQuery)) return;
        rule.walkDecls((decl, i) => {
          let { value, prop } = decl;
          if (!value.includes(unitToConvert) || !satisfyPropList(prop)) return;
          // 使用注释忽略
          const prev = decl.prev();
          if (prev?.type === 'comment' && prev.text === IGNORE_NEXT_COMMENT) {
            prev.remove();
            return;
          }
          const next = decl.next();
          if (next?.type === 'comment' && next.text === IGNORE_PREV_COMMENT) {
            if (/\n/.test(next.raws.before ?? '')) {
              result.warn(
                'Unexpected comment /* ' +
                  IGNORE_PREV_COMMENT +
                  ' */ must be after declaration at same line.',
                { node: next }
              );
            } else {
              // remove comment
              next.remove();
              return;
            }
          }
          const [unit, size] =
            landscape && params?.includes('landscape')
              ? [landscapeUnit, landscapeWidth]
              : [
                  getUnit(prop, { viewportUnit, fontViewportUnit }),
                  viewportWidth
                ];
          value = value.replace(
            pxRegex,
            createPxReplace({ minPixelValue, unitPrecision }, unit, size)
          );
          if (declarationExists(decl.parent, prop, value)) return;
          if (replace) decl.value = value;
          else decl.parent?.insertAfter(i, decl.clone({ value: value }));
        });
      });
      if (landscapeRules.length) {
        const landscapeRoot = atRule({
          params: '(orientation: landscape)',
          name: 'media'
        });
        landscapeRules.forEach(rule => {
          landscapeRoot.append(rule);
        });
        root.append(landscapeRoot);
      }
    }
  };
};
px2vp.postcss = true;

export = px2vp;
