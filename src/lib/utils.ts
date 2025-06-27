import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Comprehensive username validation following security best practices
 * Based on recommendations from Stack Overflow and security guidelines
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  // Trim whitespace first
  const trimmed = username.trim()

  // Check if empty after trimming
  if (!trimmed) {
    return { isValid: false, error: "Username cannot be empty" }
  }

  // Check length (3-20 characters)
  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long" }
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: "Username must be 20 characters or less" }
  }

  // Check for leading/trailing whitespace (shouldn't happen after trim, but double-check)
  if (username !== trimmed) {
    return { isValid: false, error: "Username cannot have leading or trailing spaces" }
  }

  // Check for multiple consecutive spaces
  if (/\s{2,}/.test(username)) {
    return { isValid: false, error: "Username cannot have multiple consecutive spaces" }
  }

  // Only allow ASCII letters, numbers, underscores, and hyphens
  // This prevents Unicode control characters, bidirectional text, and other problematic characters
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "Username can only contain English letters, numbers, underscores, and hyphens",
    }
  }

  // Prevent usernames that start with numbers (optional, but common practice)
  if (/^\d/.test(trimmed)) {
    return { isValid: false, error: "Username cannot start with a number" }
  }

  // Prevent usernames that end with hyphens or underscores (optional, but cleaner)
  if (/[-_]$/.test(trimmed)) {
    return { isValid: false, error: "Username cannot end with a hyphen or underscore" }
  }

  // Prevent consecutive hyphens or underscores (optional, but cleaner)
  if (/[-_]{2,}/.test(trimmed)) {
    return { isValid: false, error: "Username cannot have consecutive hyphens or underscores" }
  }

  return { isValid: true }
}

/**
 * Normalize username for consistent storage and comparison
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

/**
 * Check if username is reserved (common reserved usernames)
 */
export function isReservedUsername(username: string): boolean {
  const reserved = [
    "admin",
    "administrator",
    "root",
    "system",
    "support",
    "help",
    "info",
    "contact",
    "mail",
    "email",
    "webmaster",
    "postmaster",
    "hostmaster",
    "usenet",
    "news",
    "nobody",
    "noreply",
    "no-reply",
    "donotreply",
    "test",
    "demo",
    "example",
    "guest",
    "anonymous",
    "null",
    "undefined",
    "api",
    "www",
    "ftp",
    "mail",
    "pop",
    "smtp",
    "imap",
    "dns",
    "ns",
    "www-data",
    "daemon",
    "bin",
    "sys",
    "sync",
    "games",
    "man",
    "lp",
    "news",
    "uucp",
    "proxy",
    "www-data",
    "backup",
    "list",
    "irc",
    "gnats",
    "nobody",
    "libuuid",
    "dhcp",
    "syslog",
    "klog",
    "bind",
    "statd",
    "messagebus",
    "avahi",
    "avahi-autoipd",
    "speech-dispatcher",
    "kernoops",
    "pulse",
    "rtkit",
    "saned",
    "usbmux",
    "colord",
    "hplip",
    "gdm",
    "whoopsie",
    "lightdm",
    "avahi",
    "dnsmasq",
    "cups-pk-helper",
    "kernoops",
    "pulse",
    "rtkit",
    "saned",
    "usbmux",
    "colord",
    "hplip",
    "gdm",
    "whoopsie",
    "lightdm",
    "avahi",
    "dnsmasq",
    "cups-pk-helper",
  ]

  return reserved.includes(username.toLowerCase())
}
