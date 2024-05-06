import type { Linter, Rule } from 'eslint'

export interface ValidTestCaseBase extends Linter.FlatConfig {
  name?: string
  description?: string
  code: string
  options?: any
  filename?: string
  only?: boolean
  skip?: boolean

  parserOptions?: Linter.ParserOptions
  parser?: Linter.ParserModule

  onResult?: (result: Linter.FixReport) => void
}

export interface InvalidTestCaseBase extends ValidTestCaseBase {
  errors?: number | (string | Partial<Linter.LintMessage>)[]
  output?: string | ((output: string) => void)
}

export interface NormalizedTestCase extends InvalidTestCaseBase {
  type: 'valid' | 'invalid'
  code: string
}

export type InvalidTestCase = InvalidTestCaseBase | string
export type ValidTestCase = ValidTestCaseBase | string

export type TestCase = ValidTestCase | InvalidTestCase

export interface RuleTesterResult {
  /**
   * Run a single test case
   */
  each: (arg: TestCase) => Linter.FixReport
  /**
   * Run a single valid test case
   */
  valid: (arg: ValidTestCase) => Linter.FixReport
  /**
   * Run a single invalid test case
   */
  invalid: (arg: InvalidTestCase) => Linter.FixReport
  /**
   * ESLint's RuleTester style test runner, that runs multiple test cases
   */
  run: (options: RuleTesterClassicOptions) => void
}

export interface RuleTesterOptions {
  /**
   * The rule to test
   */
  rule?: Rule.RuleModule
  /**
   * The name of the rule to test
   */
  name?: string
  /**
   * Additional flat configs to be merged with the rule config
   */
  configs?: Linter.FlatConfig | Linter.FlatConfig[]
  /**
   * The number of times to recursively apply the rule
   * @default 5
   */
  recursive?: number | false
  /**
   * Run verification after applying the fix
   * @default true
   */
  verifyAfterFix?: boolean

}

export interface RuleTesterClassicOptions {
  valid?: (ValidTestCase | string)[]
  invalid?: (InvalidTestCase | string)[]
  /**
   * Callback to be called after each test case
   */
  onResult?: (_case: NormalizedTestCase, result: Linter.FixReport) => void
}
