import type { RuleTesterInitOptions, TestCasesOptions } from '../../src'
import { expect } from 'vitest'
import rule, { RULE_NAME } from './no-array-push'

const valids = [
  'const foo = [1, 2, 3]; foo.pop()',
  'const foo = { push: () => {} }; foo.push()',
]

const invalids = [
  'const foo = [1, 2, 3]; foo.push(4)',
]

export const common = {
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
