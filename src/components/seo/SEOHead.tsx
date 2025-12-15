import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

const SITE_URL = "https://artisansvalides.fr";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const SEOHead = ({ 
  title, 
  description, 
  canonical, 
  ogImage, 
  ogType = "website", 
  noIndex = false 
}: SEOHeadProps) => {
  const fullTitle = `${title} | Artisans Validés`;
  const canonicalUrl = canonical || SITE_URL;
  const imageUrl = ogImage || DEFAULT_OG_IMAGE;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:site_name" content="Artisans Validés" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
};

export default SEOHead;
