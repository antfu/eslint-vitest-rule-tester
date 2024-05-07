import type { RuleModule, RuleTesterInitOptions, TestCasesOptions } from './types'
import { createRuleTester } from './rule-tester'

/**
 * Shortcut to run test cases for a rule
 */

export function run(options: TestCasesOptions & RuleTesterInitOptions) {
  const tester = createRuleTester(options)
  return tester.run(options)
}
/**
 * Shortcut to run test cases for a rule in classic style
 */

export function runClassic(
  ruleName: string,
  rule: RuleModule,
  cases: TestCasesOptions,
  options?: RuleTesterInitOptions,
) {
  const tester = createRuleTester({
    rule,
    name: ruleName,
    ...options,
  })
  return tester.run(cases)
}
