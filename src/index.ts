import type { Container, Declaration, PluginCreator, Rule } from 'postcss';
import {
  DEFAULT_OPTIONS,
  IGNORE_NEXT_COMMENT,
  IGNORE_PREV_COMMENT,
  POSTCSS_PLUGIN
} from './const';
import createPxReplace from './lib/utils/createPxReplace';
import getUnitRegexp, { getUnit } from './lib/utils/getUnitRegexp';
import optionCreator from './lib/utils/optionCreator';
import {
  blacklistedSelector,
  isExclude,
  isInLandscapeMedia,
  isInMedia
} from './lib/validator';
import { getPropValidator } from './lib/validator/propValidator';
import type { InputType } from './type';

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

  return {
    postcssPlugin: POSTCSS_PLUGIN,
    Once(root, { result }) {
      root.walkRules(rule => {
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
        } = optionCreator({ options, defaultOptions: DEFAULT_OPTIONS, rule });

        const pxRegex = getUnitRegexp(unitToConvert);
        const propValidator = getPropValidator(propList);
        const inMedia = isInMedia(rule);

        /**
         * 校验服务
         *   1.跳过媒体查询（当mediaQuery为false）
         *   2.跳过排除文件
         *   3.跳过被忽略的选择器
         */
        if (
          (!mediaQuery && inMedia) ||
          isExclude(exclude, rule.source?.input.file) ||
          blacklistedSelector(selectorBlackList, rule.selector)
        )
          return;

        /**
         * 处理服务
         *    1. 转屏处理
         *    2. 注释忽略处理
         *    3. pxToVw 处理
         */
        // 横屏处理
        if (landscape && !inMedia) {
          const landscapeRule = rule.clone().removeAll();
          rule.walkDecls(decl => {
            const { value, prop } = decl;
            if (!value.includes(unitToConvert) || !propValidator(prop)) return;
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
        rule.walkDecls((decl, i) => {
          let { value, prop } = decl;
          if (!value.includes(unitToConvert) || !propValidator(prop)) return;
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
            landscape && isInLandscapeMedia(rule)
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
    },
    OnceExit(root, { atRule }) {
      if (!landscapeRules.length) return;
      const landscapeRoot = atRule({
        params: '(orientation: landscape)',
        name: 'media'
      });
      landscapeRules.forEach(rule => {
        landscapeRoot.append(rule);
      });
      root.append(landscapeRoot);
    }
  };
};
px2vp.postcss = true;

export = px2vp;
