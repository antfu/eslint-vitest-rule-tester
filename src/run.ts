import type { RuleModule, RuleTesterInitOptions, TestCasesOptions } from './types'
import { createRuleTester } from './rule-tester'

/**
 * Shortcut to run test cases for a rule
 */
export function run<RuleOptions = any>(options: TestCasesOptions<RuleOptions> & RuleTesterInitOptions) {
  const tester = createRuleTester<RuleOptions>(options)
  return tester.run(options)
}

/**
 * Shortcut to run test cases for a rule in classic style
 */
export function runClassic<RuleOptions = any>(
  ruleName: string,
  rule: RuleModule,
  cases: TestCasesOptions<RuleOptions>,
  options?: RuleTesterInitOptions,
) {
  const tester = createRuleTester<RuleOptions>({
    rule,
    name: ruleName,
    ...options,
  })
  return tester.run(cases)
}
