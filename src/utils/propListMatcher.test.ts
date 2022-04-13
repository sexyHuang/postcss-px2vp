import { createPropListMatcher } from './propListMatcher';

const props = [
  'width',
  'position',
  'position-y',
  'background-position',
  'background-position-y'
];

describe('propListMatcher test', () => {
  it('Test match all', () => {
    const validator = createPropListMatcher(['*']);
    expect(props.every(prop => validator(prop))).toBeTruthy();
  });
  it('Test exact', () => {
    const validator = createPropListMatcher(['width']);
    expect(props.map(validator)).toEqual([true, false, false, false, false]);
  });

  it('Test contain', () => {
    const validator = createPropListMatcher(['*position*']);
    expect(props.map(validator)).toEqual([false, true, true, true, true]);
  });
  it('Test startWith', () => {
    const validator = createPropListMatcher(['position*']);
    expect(props.map(validator)).toEqual([false, true, true, false, false]);
  });

  it('Test endWith', () => {
    const validator = createPropListMatcher(['*position']);
    expect(props.map(validator)).toEqual([false, true, false, true, false]);
  });

  it('Test not exact', () => {
    const validator = createPropListMatcher(['*', '!width']);
    expect(props.map(validator)).toEqual([false, true, true, true, true]);
  });

  it('Test not contain', () => {
    const validator = createPropListMatcher(['*', '!*position*']);
    expect(props.map(validator)).toEqual([true, false, false, false, false]);
  });
  it('Test not startWith', () => {
    const validator = createPropListMatcher(['*', '!position*']);
    expect(props.map(validator)).toEqual([true, false, false, true, true]);
  });

  it('Test not endWith', () => {
    const validator = createPropListMatcher(['*', '!*position']);
    expect(props.map(validator)).toEqual(
      [false, true, false, true, false].map(v => !v)
    );
  });
});
