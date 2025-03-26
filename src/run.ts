import type { RuleModule, RuleTesterInitOptions, TestCasesOptions } from './types'
import { createRuleTester } from './rule-tester'

/**
 * Shortcut to run test cases for a rule
 */
export function run<RuleOptions = any, MessageId extends string = string>(options: TestCasesOptions<RuleOptions, MessageId> & RuleTesterInitOptions) {
  const tester = createRuleTester<RuleOptions, MessageId>(options)
  return tester.run(options)
}

/**
 * Shortcut to run test cases for a rule in classic style
 */
export function runClassic<RuleOptions = any, MessageId extends string = string>(
  ruleName: string,
  rule: RuleModule,
  cases: TestCasesOptions<RuleOptions, MessageId>,
  options?: RuleTesterInitOptions,
) {
  const tester = createRuleTester<RuleOptions, MessageId>({
    rule,
    name: ruleName,
    ...options,
  })
  return tester.run(cases)
}
