import { Declaration } from 'postcss';
import { toString } from 'ramda';

export function getIsWalkedDeclaration() {
  const walkedSet = new Set<string>();
  return ({ prop, value, important }: Declaration) => {
    const hash = toString({ prop, value, important });
    if (walkedSet.has(hash)) return true;
    else {
      walkedSet.add(hash);
      return false;
    }
  };
}
