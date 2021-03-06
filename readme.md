# postcss-px2vp

[![npm version](https://badge.fury.io/js/postcss-px2vp.svg)](https://badge.fury.io/js/postcss-px2vp)

将 px 单位转换为视口单位的 (vw, vh, vmin, vmax) 的 [PostCSS](https://github.com/postcss/postcss) 插件.

## 简介

如果你的样式需要做根据视口大小来调整宽度，这个脚本可以将你 CSS 中的 px 单位转化为 vw，1vw 等于 1/100 视口宽度。

### 输入

```css
.class {
  margin: -10px 0.5vh;
  padding: 5vmin 9.5px 1px;
  border: 3px solid black;
  border-bottom-width: 1px;
  font-size: 14px;
  line-height: 20px;
}
.class2 {
  border: 1px solid black;
  margin-bottom: 1px;
  font-size: 20px; /* px-to-viewport-ignore */
  /* px-to-viewport-ignore-next */
  line-height: 30px;
}
@media (min-width: 750px) {
  .class3 {
    font-size: 16px;
    line-height: 22px;
  }
}
```

### 输出

```css
.class {
  margin: -1.33333vw 0.5vh;
  padding: 5vmin 1.26667vw 1px;
  border: 0.4vw solid black;
  border-bottom-width: 1px;
  font-size: 1.86667vw;
  line-height: 2.66667vw;
}
.class2 {
  border: 1px solid black;
  margin-bottom: 1px;
  font-size: 20px;
  line-height: 30px;
}
@media (min-width: 750px) {
  .class3 {
    font-size: 2.13333vw;
    line-height: 2.93333vw;
  }
}

```

## 上手

### 安装

使用 npm 安装

```
npm install postcss-px2vp --save-dev
```

或者使用 yarn 进行安装

```
yarn add -D postcss-px2vp
```

### 配置参数

默认参数:

```js
{
  unitToConvert: 'px',
  viewportWidth: 320,
  unitPrecision: 5,
  propList: ['*'],
  viewportUnit: 'vw',
  fontViewportUnit: 'vw',
  selectorBlackList: [],
  minPixelValue: 1,
  mediaQuery: false,
  replace: true,
  exclude: [],
  landscape: false,
  landscapeUnit: 'vw',
  landscapeWidth: 568
}
```

- `unitToConvert` (String) 需要转换的单位，默认为"px"
- `viewportWidth` (Number) 设计稿的视口宽度
- `unitPrecision` (Number) 单位转换后保留的精度
- `propList` (Array) 能转化为 vw 的属性列表
  - 传入特定的 CSS 属性；
  - 可以传入通配符"_"去匹配所有属性，例如：['_']；
  - 在属性的前或后添加"*",可以匹配特定的属性. (例如['*position\*'] 会匹配 background-position-y)
  - 在特定属性前加 "!"，将不转换该属性的单位 . 例如: ['*', '!letter-spacing']，将不转换 letter-spacing
  - "!" 和 "_"可以组合使用， 例如: ['_', '!font\*']，将不转换 font-size 以及 font-weight 等属性
- `viewportUnit` (String) 希望使用的视口单位
- `fontViewportUnit` (String) 字体使用的视口单位
- `selectorBlackList` (Array) 需要忽略的 CSS 选择器，不会转为视口单位，使用原有的 px 等单位。
  - 如果传入的值为字符串的话，只要选择器中含有传入值就会被匹配
    - 例如 `selectorBlackList` 为 `['body']` 的话， 那么 `.body-class` 就会被忽略
  - 如果传入的值为正则表达式的话，那么就会依据 CSS 选择器是否匹配该正则
    - 例如 `selectorBlackList` 为 `[/^body$/]` , 那么 `body` 会被忽略，而 `.body` 不会
- `minPixelValue` (Number) 设置最小的转换数值，如果为 1 的话，只有大于 1 的值会被转换
- `mediaQuery` (Boolean) 媒体查询里的单位是否需要转换单位
- `replace` (Boolean) 是否直接更换属性值，而不添加备用属性
- `exclude` (Array or Regexp) 忽略某些文件夹下的文件或特定文件，例如 'node_modules' 下的文件
  - 如果值是一个正则表达式，那么匹配这个正则的文件会被忽略
  - 如果传入的值是一个数组，那么数组里的值必须为正则
- `landscape` (Boolean) 是否添加根据 `landscapeWidth` 生成的媒体查询条件 `@media (orientation: landscape)`
- `landscapeUnit` (String) 横屏时使用的单位
- `landscapeWidth` (Number) 横屏时使用的视口宽度  
  **P.S. 所有参数都可以传入一个函数，动态改变参数**
  示例

  ```typescript
    {
      viewportWidth(rule: PostCss.Rule){
        const file = rule.source?.input.file;
        if (file?.includes('main')) return 750;
        return 375;
      }
    }
  ```

#### 直接在 gulp 中使用，添加 gulp-postcss

在 `gulpfile.js` 添加如下配置:

```js
var gulp = require('gulp');
var postcss = require('gulp-postcss');
var pxtoviewport = require('postcss-px2vp');

gulp.task('css', function () {
  var processors = [
    pxtoviewport({
      viewportWidth: 320,
      viewportUnit: 'vmin'
    })
  ];

  return gulp
    .src(['build/css/**/*.css'])
    .pipe(postcss(processors))
    .pipe(gulp.dest('build/css'));
});
```

#### 使用 PostCss 配置文件时

在`postcss.config.js`添加如下配置

```js
module.exports = {
  plugins: {
    ...
    'postcss-px2vp': {
      // options
    }
  }
}
```

## Changelog

变更日志在 [这](CHANGELOG.md).

## 许可

本项目使用 [MIT License](LICENSE).

## 借鉴至

本项目基本逻辑都是从[postcss-px-to-viewport](https://github.com/evrone/postcss-px-to-viewport/)的 clone 过来。
本项目主要做了如下工作：

- 以 typescript 重构源码；
- 添加参数动态化配置方法；
- 以 Postcss 8 推荐的方法重写了插件声明形式。
