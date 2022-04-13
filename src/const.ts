import type { Option } from './type';

export const POSTCSS_PLUGIN = 'postcss-px2vp';
export const IGNORE_NEXT_COMMENT = 'px-to-viewport-ignore-next';
export const IGNORE_PREV_COMMENT = 'px-to-viewport-ignore';

export const DEFAULT_OPTIONS: Required<Option> = {
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
};
