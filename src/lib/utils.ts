import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function matchesPattern(regexPattern: RegExp | null, text: string) {
  return !regexPattern || regexPattern.test(text);
}

export function pluralize(word: string, count: number): string {
  if (count === 1) return word;
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + "es";
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + "ies";
  return word + "s";
}
