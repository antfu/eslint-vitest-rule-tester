import type { Linter } from 'eslint'
import { objectPick } from '@antfu/utils'
import type { CompatConfigOptions } from './types'

export function pickFlatConfigFromOptions(options: CompatConfigOptions): Linter.Config | undefined {
  const picked = objectPick(
    options,
    [
      'parserOptions',
      'parser',
      'languageOptions',
      'linterOptions',
      'settings',
      'processor',
      'files',
    ] satisfies (keyof CompatConfigOptions)[],
  )

  if (picked.parserOptions) {
    picked.languageOptions ||= {}
    picked.languageOptions.parserOptions = picked.parserOptions
    if (picked.parserOptions.ecmaVersion)
      picked.languageOptions.ecmaVersion ||= picked.parserOptions.ecmaVersion
    if (picked.parserOptions.sourceType)
      picked.languageOptions.sourceType ||= picked.parserOptions.sourceType
    delete picked.parserOptions
  }
  if (picked.parser) {
    picked.languageOptions ||= {}
    picked.languageOptions.parser = picked.parser
    delete picked.parser
  }
  if (Object.keys(picked).length)
    return picked
  return undefined
}
