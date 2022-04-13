import * as fs from 'fs';
import postcss from 'postcss';
import pxToViewport from '../src/index';
import * as path from 'path';

const inputPath = path.join(__dirname, './../example/main.css');
const outputPath = path.join(
  __dirname,
  './../example/output/main-viewport.css'
);
const css = fs.readFileSync(inputPath, 'utf8');

describe('function test', () => {
  it('single file test', () => {
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
      from: inputPath
    }).css;
    const expectResult = fs.readFileSync(outputPath, 'utf-8');
    expect(processedCss).toBe(expectResult);
  });
});
