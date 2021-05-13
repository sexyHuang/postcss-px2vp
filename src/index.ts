import type { Container, Declaration, PluginCreator, Rule } from 'postcss';
import getUnitRegexp from './pixel-unit-regexp';
import { createPropListMatcher } from './prop-list-matcher';

type ViewportUnit = 'vw' | 'vh' | 'vmin' | 'vmax';

type Option = {
  /** 需要转换的单位，默认为"px" */
  unitToConvert?: string;
  /** 设计稿的视口宽度，默认为320 */
  viewportWidth?: number;

  viewportHeight?: number; // not now used; TODO: need for different units and math for different properties
  /** 单位转换后保留的精度，默认5*/
  unitPrecision?: number;
  /** 希望使用的视口单位，默认为"vw" */
  viewportUnit?: ViewportUnit;
  /** 字体使用的视口单位，默认为"vw" */
  fontViewportUnit?: ViewportUnit; // vmin is more suitable.
  /** 需要忽略的CSS选择器，不会转为视口单位，使用原有的px等单位。 */
  selectorBlackList?: (string | RegExp)[];
  /**
   * 能转化为vw的属性列表
   * - 传入特定的CSS属性；
   * - 可以传入通配符"*"去匹配所有属性，例如：['*']；
   * - 在属性的前或后添加"*",可以匹配特定的属性. (例如['*position*'] 会匹配 background-position-y)
   * - 在特定属性前加 "!"，将不转换该属性的单位 . 例如: ['*', '!letter-spacing']，将不转换letter-spacing
   * - "!" 和 "*"可以组合使用， 例如: ['*', '!font*']，将不转换font-size以及font-weight等属性
   */
  propList?: string[];
  /** 设置最小的转换数值，默认为1 */
  minPixelValue?: number;
  /** 媒体查询里的单位是否需要转换单位，默认false */
  mediaQuery?: boolean;
  /** 是否直接更换属性值，而不添加备用属性，默认true */
  replace?: boolean;
  /** 是否添加根据 `landscapeWidth` 生成的媒体查询条件 `@media (orientation: landscape)`，默认false */
  landscape?: boolean;
  /** 横屏时使用的单位，默认"vw" */
  landscapeUnit?: ViewportUnit;
  /** 忽略某些文件夹下的文件或特定文件 */
  exclude?: RegExp | RegExp[];
  /** 横屏时使用的视口宽度，默认568 */
  landscapeWidth?: number;
};

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

const postcssPlugin = 'postcss-px2vp';

type FunctionalOptions<T> = {
  [K in keyof T]: T[K] | ((rule: Rule) => T[K]);
};

type Input = FunctionalOptions<Option>;

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
  var multiplier = Math.pow(10, precision + 1),
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
    var pixels = parseFloat($1);
    if (pixels <= opts.minPixelValue) return m;
    var parsedVal = toFixed((pixels / viewportSize) * 100, opts.unitPrecision);
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
  options?: Input;
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

const px2vp: PluginCreator<Input> = options => {
  const landscapeRules: Rule[] = [];
  const defaultOptions = getDefault();

  return {
    postcssPlugin,
    Once(root, { atRule }) {
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
