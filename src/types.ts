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
  /**
   * Expected errors.
   * If a number is provided, it asserts that the number of errors is equal to the number provided.
   * If an array of strings is provided, it asserts that the error messageIds are equal to the array provided.
   * If an array of objects is provided, it asserts that the errors are partially equal to the objects provided.
   */
  errors?: number | (string | Partial<Linter.LintMessage>)[] | ((errors: Linter.LintMessage[]) => void)
  /**
   * Assert if output is expected.
   * Pass `null` to assert that the output is the same as the input.
   */
  output?: string | null | ((output: string, input: string) => void)
}

export interface NormalizedTestCase extends InvalidTestCaseBase {
  type: 'valid' | 'invalid'
  code: string
}

export type InvalidTestCase = InvalidTestCaseBase | string
export type ValidTestCase = ValidTestCaseBase | string

export type TestCase = ValidTestCase | InvalidTestCase

export interface TestExecutionResult extends Linter.FixReport {
  /**
   * If the rule fixes in multiple steps, each step will be present here
   */
  steps: Linter.FixReport[]
}

export interface RuleTester {
  /**
   * Run a single test case
   */
  each: (arg: TestCase) => TestExecutionResult
  /**
   * Run a single valid test case
   */
  valid: (arg: ValidTestCase) => TestExecutionResult
  /**
   * Run a single invalid test case
   */
  invalid: (arg: InvalidTestCase) => TestExecutionResult
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
  onResult?: (_case: NormalizedTestCase, result: Linter.FixReport) => void | Promise<void>
}
