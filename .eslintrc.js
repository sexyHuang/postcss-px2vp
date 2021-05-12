module.exports = {
  rules: {
    'no-shadow': 'off',
    camelcase: 'off',

    'no-unused-vars': ['warn', { varsIgnorePattern: 'Taro', args: 'none' }],

    'import/no-commonjs': 0,
    'import/prefer-default-export': 0,
    'react/sort-comp': 0,
    'jsx-quotes': 0
  }
};
