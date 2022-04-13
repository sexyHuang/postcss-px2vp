import * as fs from 'fs';
import postcss from 'postcss';
import pxToViewport from '../src/index';
import * as path from 'path';

const inputPath = path.join(__dirname, './main.css');
const outputPath = path.join(__dirname, './output/main-viewport.css');
const css = fs.readFileSync(inputPath, 'utf8');

const processedCss = postcss(
  pxToViewport({
    mediaQuery: true,
    landscape: true,
    viewportWidth(rule) {
      const file = rule.source?.input.file;
      if (file?.includes('main')) return 750;
      return 375;
    }
  })
).process(css, {
  from: inputPath,
  to: outputPath
}).css;

fs.writeFile(outputPath, processedCss, function (err) {
  if (err) {
    console.log(err);
    throw err;
  }
  console.log('File with viewport units written.');
});
