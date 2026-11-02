/**
 * Validation utility functions
 */

/**
 * Validate email address
 * @param email - Email to validate
 * @returns true if valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 * @param url - URL to validate
 * @returns true if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate GitHub URL
 * @param url - URL to validate
 * @returns true if valid GitHub URL
 */
export function isValidGithubUrl(url: string): boolean {
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
  return githubRegex.test(url);
}

/**
 * Check if string is empty or whitespace
 * @param str - String to check
 * @returns true if empty or whitespace
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Validate minimum string length
 * @param str - String to validate
 * @param minLength - Minimum required length
 * @returns true if string meets minimum length
 */
export function hasMinLength(str: string, minLength: number): boolean {
  return str.trim().length >= minLength;
}

/**
 * Validate maximum string length
 * @param str - String to validate
 * @param maxLength - Maximum allowed length
 * @returns true if string is within maximum length
 */
export function hasMaxLength(str: string, maxLength: number): boolean {
  return str.trim().length <= maxLength;
}

/**
 * Check if value is numeric
 * @param value - Value to check
 * @returns true if numeric
 */
export function isNumeric(value: string | number): boolean {
  return !isNaN(Number(value)) && isFinite(Number(value));
}
