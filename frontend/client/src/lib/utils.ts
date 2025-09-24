import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function to merge Tailwind CSS classes.
 *
 * This function combines the functionality of `clsx` for conditional classes
 * and `tailwind-merge` to resolve conflicting class names.
 *
 * @param {...ClassValue[]} inputs - A list of class values to be merged.
 * @returns {string} The merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
