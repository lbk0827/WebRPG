// 결정론 강제 규칙 (docs/05_M1_전투엔진_명세.md §3.1)
// 엔진 소스는 Math.random / Date 에 접근할 수 없다.
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**'],
  },
  {
    files: ['packages/engine/src/**/*.ts'],
    languageOptions: { parser: tsParser, ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: '엔진은 결정론적이어야 한다. 시드 기반 rng.ts 를 사용할 것.',
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: '엔진은 시간에 의존할 수 없다.' },
        { name: 'performance', message: '엔진은 시간에 의존할 수 없다.' },
      ],
    },
  },
]
