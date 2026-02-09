import { getYouTubeEmbedUrl } from "@/lib/youtubeEmbed";

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

const YouTubeEmbed = ({ url, title = "Vidéo YouTube", className = "" }: YouTubeEmbedProps) => {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <iframe
      src={embedUrl}
      title={title}
      className={`w-full h-full rounded-xl ${className}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      loading="lazy"
    />
  );
};

export default YouTubeEmbed;
