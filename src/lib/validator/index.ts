import type { AtRule, Container, Declaration, Node } from 'postcss';

export const isExclude = (exclude: RegExp | RegExp[], file?: string) => {
  if (!file) return false;
  if (Array.isArray(exclude)) return exclude.some(reg => reg.test(file));
  return exclude.test(file);
};

export const blacklistedSelector = (
  blacklist: (string | RegExp)[],
  selector: string
) =>
  blacklist.some(rule => {
    if (typeof rule === 'string') return selector.includes(rule);
    return rule.test(selector);
  });

export function isInMedia(
  node: Node
): node is Omit<Node, 'parent'> & { parent: AtRule } {
  if (node.parent?.type === 'atrule') {
    return (node.parent as AtRule).name === 'media';
  } else {
    return false;
  }
}

export function isInLandscapeMedia(node: Node) {
  return isInMedia(node) && node.parent.params.includes('landscape');
}

export function declarationExists(
  decls: Container | undefined,
  prop: string,
  value: string
) {
  if (!decls) return false;
  return decls.some(
    (decl: Declaration) => decl.prop === prop && decl.value === value
  );
}
