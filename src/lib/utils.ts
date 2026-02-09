import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Default avatar for users without profile photo
export const DEFAULT_AVATAR = "/favicon.png";

/**
 * Ensures a URL has a proper protocol prefix (https://).
 * Returns null if the input is falsy.
 */
export function ensureHttps(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}
