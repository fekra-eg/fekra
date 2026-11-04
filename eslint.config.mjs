import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // The last two are screenshot output from scripts/check-viewports.mjs — it
    // drops a whole headless Chrome profile there, which is ~2800 lint findings
    // in vendored extension code if it is left in scope.
    ignores: ['src/migrations/**', '.next*/', 'src/payload-types.ts', 'src/payload-generated-schema.ts', 'viewport-shots/', '.lighthouse/'],
  },
  { files: ['postman/mocks/**/default.js'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
]

export default eslintConfig
