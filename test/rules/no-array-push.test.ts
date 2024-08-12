import path from 'node:path'
import tsParser from '@typescript-eslint/parser'
import { expect } from 'vitest'
import type { RuleTesterInitOptions, TestCasesOptions } from '../../src'
import { run } from '../../src'
import rule, { RULE_NAME } from './no-array-push'

const valids = [
  'const foo = [1, 2, 3]; foo.pop()',
  'const foo = { push: () => {} }; foo.push()',
]

const invalids = [
  'const foo = [1, 2, 3]; foo.push(4)',
]

const common = {
  name: RULE_NAME,
  rule: rule as any,

  valid: valids,
  invalid: invalids.map(i => ({
    code: i,
    errors: [{ messageId: 'noArrayPush' }],
  })),

  onResult(_case, result) {
    if (_case.type === 'invalid')
      expect(result.output).toMatchSnapshot()
  },
} satisfies TestCasesOptions & RuleTesterInitOptions

// Using `project` - custom fixture.
run({
  ...common,
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      tsconfigRootDir: path.join(import.meta.dirname, './ts-fixture'),
      project: true,
    },
  },
})

// Using `projectService` - default project.
run({
  ...common,
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      projectService: true,
    },
  },
})

// Using `projectService` - custom fixture.
run({
  ...common,
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      tsconfigRootDir: path.join(import.meta.dirname, './ts-fixture'),
      projectService: {
        // Ensure we're not using the default project
        maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 0,
      },
    },
  },
})
