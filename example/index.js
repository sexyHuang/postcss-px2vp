'use strict';
exports.__esModule = true;
var fs = require('fs');
var postcss_1 = require('postcss');
var pxToViewport = require('../dist/index');
var path = require('path');
var css = fs.readFileSync(path.join(__dirname, './main.css'), 'utf8');
var processedCss = postcss_1['default'](
  pxToViewport({
    mediaQuery: true,
    viewportWidth: function (rule) {
      var _a;
      var file =
        (_a = rule.source) === null || _a === void 0 ? void 0 : _a.input.file;
      if (file === null || file === void 0 ? void 0 : file.includes('main'))
        return 750;
      return 375;
    }
  })
).process(css, {
  from: path.join(__dirname, './main.css')
}).css;
fs.writeFile('main-viewport.css', processedCss, function (err) {
  if (err) {
    throw err;
  }
  console.log('File with viewport units written.');
});
