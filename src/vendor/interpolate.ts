// Forked from https://github.com/eslint/eslint/blob/ad9dd6a933fd098a0d99c6a9aa059850535c23ee/lib/linter/interpolate.js

export function interpolate(
  text: string,
  data: Record<string, any> | undefined,
): string {
  if (!data)
    return text

  // Substitution content for any {{ }} markers.
  return text.replace(
    /\{\{([^{}]+)\}\}/gu,
    (fullMatch, termWithWhitespace: string) => {
      const term = termWithWhitespace.trim()

      if (term in data)
        return String(data[term])

      // Preserve old behavior: If parameter name not provided, don't replace it.
      return fullMatch
    },
  )
}
