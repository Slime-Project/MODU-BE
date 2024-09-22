module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  root: true,
  env: {
    node: true,
    jest: true
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'prettier/prettier': 'error',
    'import/extensions': [
      'error',
      'never',
      {
        js: 'never',
        ts: 'never'
      }
    ],
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        groups: ['builtin', 'external', 'parent', 'sibling', 'type'],
        pathGroups: [
          {
            pattern: '@/types/**',
            group: 'type'
          },
          {
            pattern: '**/model',
            group: 'type'
          },
          {
            pattern: '@/**',
            group: 'parent'
          }
        ],
        pathGroupsExcludedImportTypes: [],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],
    'import/no-unresolved': [2, { ignore: ['@/'] }],
    'import/prefer-default-export': 'off'
  }
};
