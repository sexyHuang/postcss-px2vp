"use strict";
exports.__esModule = true;
var fs = require("fs");
var postcss_1 = require("postcss");
var pxToViewport = require("../dist/index");
var path = require("path");
var inputPath = path.join(__dirname, './main.css');
var outputPath = path.join(__dirname, './main-viewport.css');
var css = fs.readFileSync(inputPath, 'utf8');
var processedCss = postcss_1["default"](pxToViewport({
    mediaQuery: true,
    landscape: true,
    viewportWidth: function (rule) {
        var _a;
        var file = (_a = rule.source) === null || _a === void 0 ? void 0 : _a.input.file;
        if (file === null || file === void 0 ? void 0 : file.includes('main'))
            return 750;
        return 375;
    }
})).process(css, {
    from: inputPath,
    to: outputPath
}).css;
fs.writeFile('main-viewport.css', processedCss, function (err) {
    if (err) {
        throw err;
    }
    console.log('File with viewport units written.');
});
