import Rule from 'postcss/lib/rule';
import { InputType, Option } from '../type';

function getOption<T>(
  option: T,
  rule: Rule
): T extends (rule: Rule) => infer K ? K : T {
  return typeof option === 'function' ? option(rule) : option;
}

export default function optionCreator({
  options,
  rule,
  defaultOptions
}: {
  options?: InputType;
  rule: Rule;
  defaultOptions: Required<Option>;
}): Required<Option> {
  if (!options) return defaultOptions;
  return {
    ...defaultOptions,
    ...Object.entries(options).reduce((prev, [key, value]) => {
      prev[key] = getOption(value, rule);
      return prev;
    }, {} as any)
  };
}
