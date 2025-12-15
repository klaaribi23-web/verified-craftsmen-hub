import { Helmet } from 'react-helmet-async';

const OrganizationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Artisans Validés",
    "url": "https://artisansvalides.fr",
    "logo": "https://artisansvalides.fr/favicon.png",
    "description": "La plateforme de confiance pour trouver des artisans vérifiés et qualifiés en France",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Paris",
      "addressCountry": "FR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+33123456789",
      "email": "contact@artisansvalides.fr",
      "contactType": "customer service"
    },
    "sameAs": [
      "https://www.facebook.com/artisansvalides",
      "https://www.instagram.com/artisansvalides",
      "https://www.linkedin.com/company/artisansvalides"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default OrganizationSchema;
