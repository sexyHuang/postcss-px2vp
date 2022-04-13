import getUnitRegexp from './getUnitRegexp';

type CustomMatchersCreator<M extends jest.ExpectExtendMap, R> = {
  [K in keyof M]: M[K] extends (
    this: infer This,
    received: any,
    ...actual: infer Actual
  ) => any
    ? (this: This, ...artual: Actual) => R
    : never;
};

const customMatcher = {
  toBeMatchAll(received: string, regexp: RegExp, results: string[][]) {
    const matches = [...received.matchAll(regexp)].filter(([_, ...arr]) =>
      arr.some(item => item)
    );
    if (
      matches.length === results.length &&
      matches.every(([_, ...paths], idx) => {
        const res = results[idx];
        return (
          res &&
          res.length === paths.length &&
          paths.every((item, i) => item === res[i])
        );
      })
    ) {
      return {
        message: () =>
          `expected ${received} to be match ${results} with ${regexp}`,
        pass: true
      };
    } else
      return {
        message: () =>
          `expected ${received} not to be match ${results} with ${regexp}`,
        pass: false
      };
  }
};
type CustomMatchers<R = unknown> = CustomMatchersCreator<
  typeof customMatcher,
  R
>;

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

expect.extend(customMatcher);
const unit = 'px';

describe('getUnitRegexp test', () => {
  const unitRegexp = getUnitRegexp(unit);

  it('Test any digit followed by px', () => {
    expect('20px').toBeMatchAll(unitRegexp, [['20']]);
    expect('20.4px').toBeMatchAll(unitRegexp, [['20.4']]);
  });

  it('Test not anything inside url()', () => {
    expect('url(20px)').not.toBeMatchAll(unitRegexp, [['20']]);
  });

  it('Test not anything inside single quotes', () => {
    expect(`'20px'`).not.toBeMatchAll(unitRegexp, [['20']]);
  });

  it('Test not anything inside double quotes', () => {
    expect(`"20px"`).not.toBeMatchAll(unitRegexp, [['20']]);
  });

  it('Test in complex scene', () => {
    expect(`'20px' 21px url(22px) 23.0px "24px"`).toBeMatchAll(unitRegexp, [
      ['21'],
      ['23.0']
    ]);
  });
});
