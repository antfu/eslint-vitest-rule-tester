import path from 'node:path'
import tsParser from '@typescript-eslint/parser'
import { run } from '../../src'
import { common } from './no-array-push.cases'

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
