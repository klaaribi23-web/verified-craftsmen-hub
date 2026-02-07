import { Helmet } from 'react-helmet-async';

interface LocalBusinessSchemaProps {
  name: string;
  image?: string;
  city: string;
  region?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  phone?: string;
  email?: string;
  googleBusinessUrl?: string;
}

const LocalBusinessSchema = ({
  name,
  image,
  city,
  region,
  rating,
  reviewCount,
  description,
  phone,
  email,
  googleBusinessUrl
}: LocalBusinessSchemaProps) => {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": name,
    "description": description || `${name} - Artisan qualifié à ${city}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      ...(region && { "addressRegion": region }),
      "addressCountry": "FR"
    }
  };

  if (image) {
    schema.image = image;
  }

  if (rating && reviewCount && reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": rating.toFixed(1),
      "reviewCount": reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  if (phone) {
    schema.telephone = phone;
  }

  if (email) {
    schema.email = email;
  }

  if (googleBusinessUrl) {
    schema.url = googleBusinessUrl;
    schema.sameAs = [googleBusinessUrl];
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default LocalBusinessSchema;
