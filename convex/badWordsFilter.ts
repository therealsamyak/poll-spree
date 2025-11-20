import { BAD_WORDS_LIST } from "./badWordsList"

/**
 * Validates text input for inappropriate content using the custom bad words list
 * @param text - The text to validate
 * @returns true if the text is valid, false if it contains inappropriate content
 */
export const validateTextContent = (text: string): boolean => {
  // Trim whitespace first
  const trimmed = text.trim()

  // Check if empty after trimming
  if (!trimmed) {
    return false
  }

  // Check for inappropriate content using the custom bad words list
  const normalizedText = trimmed.toLowerCase()
  const words = normalizedText.split(/\W+/) // Split on non-word characters
  const hasInappropriateContent = BAD_WORDS_LIST.some((badWord) => {
    const normalizedBadWord = badWord.toLowerCase()

    // Check for exact word matches
    if (words.includes(normalizedBadWord)) {
      return true
    }

    // Check for common character substitutions (leetspeak)
    const leetSubstitutions = {
      a: ["@", "4", "a"],
      e: ["3", "e"],
      i: ["1", "!", "i"],
      o: ["0", "o"],
      s: ["$", "5"],
      t: ["7"],
      u: [
        "ü",
        "ù",
        "ú",
        "û",
        "ü",
        "ū",
        "ů",
        "ű",
        "ų",
        "ư",
        "ū",
        "ů",
        "ű",
        "ų",
        "ư",
      ],
    }

    // Create variations with leetspeak substitutions
    const variations = [normalizedBadWord]

    for (const [original, substitutes] of Object.entries(leetSubstitutions)) {
      const newVariations: string[] = []
      for (const variation of variations) {
        if (variation.includes(original)) {
          for (const substitute of substitutes) {
            newVariations.push(
              variation.replace(new RegExp(original, "g"), substitute),
            )
          }
        }
      }
      variations.push(...newVariations)
    }

    // Check if any variation is found as a whole word in the text
    return variations.some((variation) => words.includes(variation))
  })

  return !hasInappropriateContent
}

/**
 * Validates multiple text inputs at once
 * @param inputs - Object with field names as keys and text values
 * @returns Object with validation result and the first invalid field name if any
 */
export const validateMultipleTextInputs = (
  inputs: Record<string, string>,
): { isValid: boolean; fieldName: string } => {
  for (const [fieldName, text] of Object.entries(inputs)) {
    if (!validateTextContent(text)) {
      return { isValid: false, fieldName }
    }
  }
  return { isValid: true, fieldName: "" }
}
