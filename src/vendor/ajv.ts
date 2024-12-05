// Forked from https://github.com/eslint/eslint/blob/7fe4114be2e714506fd406ea4474430ea3de0f93/lib/config/flat-config-helpers.js and https://github.com/eslint/eslint/blob/7fe4114be2e714506fd406ea4474430ea3de0f93/lib/shared/ajv.js

import Ajv from 'ajv'
import metaSchema from 'ajv/lib/refs/json-schema-draft-04.json'

export function getAjvInstance() {
  const ajv = new Ajv({
    meta: false,
    useDefaults: true,
    validateSchema: false,
    missingRefs: 'ignore',
    verbose: true,
    schemaId: 'auto',
    strictDefaults: true,
  })

  ajv.addMetaSchema(metaSchema)
  // @ts-expect-error unexposed
  ajv._opts.defaultMeta = metaSchema.id

  return ajv
}

const noOptionsSchema = Object.freeze({
  type: 'array',
  minItems: 0,
  maxItems: 0,
})

export function getRuleOptionsSchema(rule: any) {
  if (!rule?.meta)
    return { ...noOptionsSchema }

  const schema = rule.meta.schema

  if (typeof schema === 'undefined')
    return { ...noOptionsSchema }

  if (schema === false)
    return null

  if (typeof schema !== 'object' || schema === null)
    throw new TypeError(`Rule's \`meta.schema\` must be an array or object`)

  if (Array.isArray(schema)) {
    if (schema.length) {
      return {
        type: 'array',
        items: schema,
        minItems: 0,
        maxItems: schema.length,
      }
    }
    else {
      return {
        ...noOptionsSchema,
      }
    }
  }

  return schema
}
