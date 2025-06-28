import { Filter } from "bad-words"

// Initialize the bad-words filter
const filter = new Filter()

/**
 * Validates text input for inappropriate content using the bad-words npm package
 * @param text - The text to validate
 * @returns true if the text is safe, false if it contains inappropriate content
 */
export const isTextSafe = (text: string): boolean => {
  // Trim whitespace first
  const trimmed = text.trim()

  // Check if empty after trimming
  if (!trimmed) {
    return false
  }

  // Check for inappropriate content using the bad-words filter
  return !filter.isProfane(trimmed)
}

/**
 * Validates multiple text inputs at once
 * @param inputs - Object with field names as keys and text values
 * @returns Object with validation result and the first invalid field name if any
 */
export const validateMultipleInputs = (
  inputs: Record<string, string>,
): { isValid: boolean; fieldName: string } => {
  for (const [fieldName, text] of Object.entries(inputs)) {
    if (!isTextSafe(text)) {
      return { isValid: false, fieldName }
    }
  }
  return { isValid: true, fieldName: "" }
}
