import type { PluginCreator, Rule } from 'postcss';
import {
  DEFAULT_OPTIONS,
  IGNORE_NEXT_COMMENT,
  IGNORE_PREV_COMMENT,
  POSTCSS_PLUGIN
} from './const';
import getValueTransformer from './lib/transformer/valueTransformer';
import optionCreator from './lib/utils/optionCreator';
import {
  blacklistedSelector,
  isExclude,
  isInLandscapeMedia,
  isInMedia
} from './lib/validator';
import { getIsWalkedDeclaration } from './lib/validator/isWalkedDeclaration';
import { getPropValidator } from './lib/validator/propValidator';
import type { InputType } from './type';

const px2vp: PluginCreator<InputType> = options => {
  const landscapeRules: Rule[] = [];

  return {
    postcssPlugin: POSTCSS_PLUGIN,
    Once(root, { result }) {
      root.walkRules(rule => {
        // init options
        const _options = optionCreator({
          options,
          defaultOptions: DEFAULT_OPTIONS,
          rule
        });
        const {
          exclude,
          selectorBlackList,
          propList,
          landscape,
          unitToConvert,
          mediaQuery,
          replace
        } = _options;
        const valueTransformer = getValueTransformer(_options);
        const propValidator = getPropValidator(propList);
        const inMedia = isInMedia(rule);
        const isWalkedDeclaration = getIsWalkedDeclaration();

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
        const landscapeRule = rule.clone().removeAll();
        rule.walkDecls((decl, i) => {
          let { value, prop } = decl;
          if (
            !value.includes(unitToConvert) ||
            !propValidator(prop) ||
            isWalkedDeclaration(decl)
          )
            return;
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

          // 横屏处理
          if (landscape && !inMedia) {
            landscapeRule.append(
              decl.clone({
                value: valueTransformer(decl, true)
              })
            );
          }

          value = valueTransformer(decl, isInLandscapeMedia(rule));
          if (replace) decl.value = value;
          else decl.parent?.insertAfter(i, decl.clone({ value: value }));
        });
        if (landscapeRule.nodes.length > 0) {
          landscapeRules.push(landscapeRule);
        }
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
