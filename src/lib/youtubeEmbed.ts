/**
 * Extracts YouTube video ID from various URL formats.
 */
export const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&?#]+)/,
    /(?:youtu\.be\/)([^&?#]+)/,
    /(?:youtube\.com\/embed\/)([^&?#]+)/,
    /(?:youtube\.com\/shorts\/)([^&?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

/**
 * Checks if a URL is a YouTube link.
 */
export const isYouTubeUrl = (url: string): boolean => {
  return /youtube\.com|youtu\.be/i.test(url);
};

/**
 * Returns the embed URL for a YouTube video.
 */
export const getYouTubeEmbedUrl = (url: string): string | null => {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0`;
};

/**
 * Returns the thumbnail URL for a YouTube video.
 */
export const getYouTubeThumbnail = (url: string): string | null => {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
};
