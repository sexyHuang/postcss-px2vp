import type { Rule } from 'postcss';
import type { Simplify } from 'type-fest';

export declare type ViewportUnit = 'vw' | 'vh' | 'vmin' | 'vmax';

export declare type Option = {
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

/**
 * 合并两个类型，同名属性类型联合，保留各自属性
 */
type UnionProps<T, U> = Simplify<
  {
    [K in keyof T]: K extends keyof U ? T[K] | U[K] : T[K];
  } &
    {
      [K in Exclude<keyof U, keyof T>]: U[K];
    }
>;

type FunctionalOptions<T, P extends any[] = []> = {
  [K in keyof T]: (...arg: P) => T[K];
};

export declare type InputType = UnionProps<
  Option,
  FunctionalOptions<Option, [rule: Rule]>
>;

export {};
