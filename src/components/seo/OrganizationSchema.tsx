import { Helmet } from 'react-helmet-async';

const OrganizationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Artisans Validés",
    "alternateName": "L'Alliance des Artisans Validés",
    "url": "https://artisansvalides.fr",
    "logo": "https://artisansvalides.fr/favicon.png",
    "description": "Le premier réseau d'artisans audités garantissant une exclusivité sectorielle et zéro commission sur les chantiers.",
    "keywords": "Réseau Artisan, Expertise Bâtiment, Label Qualité, Apporteurs d'affaires sans commission, artisans vérifiés, exclusivité sectorielle, zéro commission",
    "slogan": "Récupérez 100% de votre marge. Zéro commission.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "77 rue de la Monnaie",
      "postalCode": "59800",
      "addressLocality": "Lille",
      "addressRegion": "Hauts-de-France",
      "addressCountry": "FR"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+33353632999",
      "email": "contact@artisansvalides.fr",
      "contactType": "customer service",
      "availableLanguage": "French"
    },
    "areaServed": {
      "@type": "Country",
      "name": "France"
    },
    "knowsAbout": [
      "Rénovation énergétique",
      "Plomberie",
      "Électricité",
      "Maçonnerie",
      "Toiture",
      "Isolation thermique",
      "Normes DTU",
      "Assurance décennale"
    ],
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
