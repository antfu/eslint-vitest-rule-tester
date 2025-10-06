import type { Linter } from 'eslint'

export type Awaitable<T> = Promise<T> | T
export interface ValidTestCaseBase<RuleOptions = any, MessageId extends string = string> extends CompatConfigOptions, RuleTesterBehaviorOptions {
  name?: string
  description?: string
  code: string
  options?: RuleOptions
  filename?: string
  only?: boolean
  skip?: boolean
  before?: (this: NormalizedTestCase<RuleOptions, MessageId>, configs: Linter.Config[]) => Awaitable<void>
  after?: (this: NormalizedTestCase<RuleOptions, MessageId>, result: Linter.FixReport) => Awaitable<void>

  /**
   * @deprecated Use `after` instead
   */
  onResult?: (result: Linter.FixReport) => void
}

export type TestCaseError<MessageId extends string = string> = Partial<Linter.LintMessage> & {
  /**
   * Data for interpolate the error message
   */
  data?: Record<string, any>
  /**
   * Alias to `nodeType`
   * @deprecated `nodeType` is deprecated and will be removed in the next major version.
   */
  type?: string
  messageId?: MessageId
}

export interface InvalidTestCaseBase<RuleOptions = any, MessageId extends string = string> extends ValidTestCaseBase<RuleOptions, MessageId> {
  /**
   * Expected errors.
   * If a number is provided, it asserts that the number of errors is equal to the number provided.
   * If an array of strings is provided, it asserts that the error messageIds are equal to the array provided.
   * If an array of objects is provided, it asserts that the errors are partially equal to the objects provided.
   */
  errors?: number | (MessageId | TestCaseError<MessageId>)[] | ((errors: Linter.LintMessage[]) => Awaitable<void>)
  /**
   * Assert if output is expected.
   * Pass `null` to assert that the output is the same as the input.
   */
  output?: string | null | ((output: string, input: string) => Awaitable<void>)
}

export interface NormalizedTestCase<RuleOptions = any, MessageId extends string = string> extends InvalidTestCaseBase<RuleOptions, MessageId> {
  type: 'valid' | 'invalid'
  code: string
}

export type InvalidTestCase<RuleOptions = any, MessageId extends string = string> = InvalidTestCaseBase<RuleOptions, MessageId> | string
export type ValidTestCase<RuleOptions = any> = ValidTestCaseBase<RuleOptions> | string

export type TestCase<RuleOptions = any, MessageId extends string = string> = ValidTestCase<RuleOptions> | InvalidTestCase<RuleOptions, MessageId>

export interface TestExecutionResult extends Linter.FixReport {
  /**
   * If the rule fixes in multiple steps, each step will be present here
   */
  steps: Linter.FixReport[]
}

export interface CompatConfigOptions {
  parserOptions?: Linter.ParserOptions
  parser?: Linter.Parser
  languageOptions?: Linter.Config['languageOptions']
  linterOptions?: Linter.Config['linterOptions']
  settings?: Linter.Config['settings']
  processor?: Linter.Config['processor']
  files?: Linter.Config['files']
}

export type RuleModule = any // to allow any rule module

export interface RuleTester<RuleOptions = any, MessageId extends string = string> {
  /**
   * Run a single test case
   */
  each: (arg: TestCase<RuleOptions, MessageId>) => Promise<{ testcase: NormalizedTestCase<RuleOptions, MessageId>, result: TestExecutionResult }>
  /**
   * Run a single valid test case
   */
  valid: (arg: ValidTestCase<RuleOptions>) => Promise<{ testcase: NormalizedTestCase<RuleOptions, MessageId>, result: TestExecutionResult }>
  /**
   * Run a single invalid test case
   */
  invalid: (arg: InvalidTestCase<RuleOptions, MessageId>) => Promise<{ testcase: NormalizedTestCase<RuleOptions, MessageId>, result: TestExecutionResult }>
  /**
   * ESLint's RuleTester style test runner, that runs multiple test cases
   */
  run: (options: TestCasesOptions<RuleOptions, MessageId>) => Promise<void>
}

export interface RuleTesterBehaviorOptions {
  /**
   * The number of times to recursively apply the rule
   * @default 10
   */
  recursive?: number | false
  /**
   * Run verification after applying the fix
   * @default true
   */
  verifyAfterFix?: boolean
  /**
   * Verify that fix allways changes the code
   * @default true
   */
  verifyFixChanges?: boolean
}

export interface DefaultFilenames {
  js: string
  jsx: string
  ts: string
  tsx: string
}

export interface RuleTesterInitOptions extends CompatConfigOptions, RuleTesterBehaviorOptions {
  /**
   * The rule to test
   */
  rule?: RuleModule
  /**
   * The name of the rule to test
   */
  name?: string
  /**
   * Additional flat configs to be merged with the rule config
   */
  configs?: Linter.Config | Linter.Config[]
  /**
   * The default filenames to use for type-aware tests.
   * @default { js: 'file.js', jsx: 'file.jsx', ts: 'file.ts', tsx: 'file.tsx' }
   */
  defaultFilenames?: Partial<DefaultFilenames>
}

export interface TestCasesOptions<RuleOptions = any, MessageId extends string = string> {
  valid?: (ValidTestCase<RuleOptions> | string)[]
  invalid?: (InvalidTestCase<RuleOptions, MessageId> | string)[]
  /**
   * Callback to be called after each test case
   */
  onResult?: (_case: NormalizedTestCase<RuleOptions, MessageId>, result: Linter.FixReport) => void | Promise<void>
}
