import type { Container, Declaration, PluginCreator, Rule } from 'postcss';
import {
  IGNORE_NEXT_COMMENT,
  IGNORE_PREV_COMMENT,
  POSTCSS_PLUGIN
} from './const';
import type { InputType, Option } from './type';
import createPxReplace from './utils/createPxReplace';
import getUnitRegexp, { getUnit } from './utils/getUnitRegexp';
import optionCreator from './utils/optionCreator';
import { createPropListMatcher } from './utils/propListMatcher';
import { blacklistedSelector, isExclude } from './utils/validators';

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

function validateParams(params: undefined | string, mediaQuery: boolean) {
  return !params || (params && mediaQuery);
}

function declarationExists(
  decls: Container | undefined,
  prop: string,
  value: string
) {
  if (!decls) return false;
  return decls.some(
    (decl: Declaration) => decl.prop === prop && decl.value === value
  );
}

const px2vp: PluginCreator<InputType> = options => {
  const landscapeRules: Rule[] = [];
  const defaultOptions = getDefault();

  return {
    postcssPlugin: POSTCSS_PLUGIN,
    Once(root, { atRule, result }) {
      root.walkRules(rule => {
        const file = rule.source?.input.file;

        // init options
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
