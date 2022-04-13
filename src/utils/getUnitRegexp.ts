import { ViewportUnit } from '../type';

/**
 * Not anything inside double quotes;
 * Not anything inside single quotes;
 * Not anything inside url();
 * Any digit followed by px;
 * !single quotes|!double quotes|!url()|pixel unit.
 * @param unit
 * @returns RegExp
 */
export default function getUnitRegexp(unit: string) {
  return new RegExp(
    '"[^"]+"|\'[^\']+\'|url\\([^\\)]+\\)|(\\d*\\.?\\d+)' + unit,
    'g'
  );
}

export function getUnit(
  prop: string,
  opts: { viewportUnit: ViewportUnit; fontViewportUnit: ViewportUnit }
) {
  return !prop.includes('font') ? opts.viewportUnit : opts.fontViewportUnit;
}
