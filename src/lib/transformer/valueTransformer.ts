//const createValueTransformer

import { Declaration } from 'postcss';
import { memoizeWith, toString } from 'ramda';
import { Option } from '../../type';
import createPxReplace from '../utils/createPxReplace';
import getUnitRegexp from '../utils/getUnitRegexp';

function createValueTransformer({
  unitToConvert,
  viewportUnit,
  viewportWidth,
  fontViewportUnit,
  landscape,
  landscapeUnit,
  landscapeWidth,
  minPixelValue,
  unitPrecision
}: Required<Option>) {
  const pxRegex = getUnitRegexp(unitToConvert);
  return ({ prop, value }: Declaration, isInLandscapeMedia = false) => {
    let [unit, size] = [viewportUnit, viewportWidth];
    if (prop.includes('font')) unit = fontViewportUnit;
    else if (landscape && isInLandscapeMedia) {
      [unit, size] = [landscapeUnit, landscapeWidth];
    }
    return value.replace(
      pxRegex,
      createPxReplace({ minPixelValue, unitPrecision }, unit, size)
    );
  };
}

const getValueTransformer = memoizeWith(toString, createValueTransformer);
export default getValueTransformer;
