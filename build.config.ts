import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: 'node16',
  clean: true,
  rollup: {
    inlineDependencies: [
      '@antfu/utils',
      'ajv',
      'ajv/lib/refs/json-schema-draft-04.json',
      'fast-json-stable-stringify',
      'fast-deep-equal',
      'uri-js',
      'json-schema-traverse',
    ],
  },
})
