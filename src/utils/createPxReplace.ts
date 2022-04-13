import { ViewportUnit } from '../type';
import toFixed from './toFixed';

export default function createPxReplace(
  opts: { minPixelValue: number; unitPrecision: number },
  viewportUnit: ViewportUnit,
  viewportSize: number
) {
  return function (m: string, $1: string) {
    if (!$1) return m;
    const pixels = parseFloat($1);
    if (pixels <= opts.minPixelValue) return m;
    const parsedVal = toFixed(
      (pixels / viewportSize) * 100,
      opts.unitPrecision
    );
    return parsedVal === 0 ? '0' : `${parsedVal}${viewportUnit}`;
  };
}
