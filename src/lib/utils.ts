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

/**
 * Adds Supabase Storage image transformation parameters to optimize delivery.
 * Only applies to Supabase Storage URLs (containing 'supabase.co/storage').
 * Skips URLs that already have query parameters.
 */
export function optimizeImageUrl(url: string | null | undefined, size: 'card' | 'large' = 'large'): string {
  if (!url) return '';
  if (!url.includes('supabase.co/storage')) return url;
  if (url.includes('?')) return url;
  const params = size === 'card'
    ? '?width=400&quality=75&format=webp'
    : '?width=800&quality=75&format=webp';
  return `${url}${params}`;
}
