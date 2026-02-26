import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ArtisanCard from "@/components/artisan-search/ArtisanCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, Shield, CheckCircle2, Leaf, ArrowRight, Users } from "lucide-react";
import { useSeoCity, useSeoMetier, useNearbyCities, useRelatedMetiers } from "@/hooks/useSeoData";
import { useSeoArtisans } from "@/hooks/useSeoArtisans";
import { useCategories } from "@/hooks/useCategories";

const ENERGY_SLUGS = ["photovoltaique", "isolation", "pac", "chauffagiste", "electricien-irve", "menuiserie-exterieure"];

const ArtisansSeoPage = () => {
  const { slug } = useParams<{ slug: string }>();

  // Parse metier-ville from slug (e.g. "plombier-lille" or "electricien-irve-bordeaux")
  const parseSeoSlug = (s: string | undefined) => {
    if (!s) return { metierSlug: "", villeSlug: "" };
    // Try known multi-word métier slugs first
    const multiWordPrefixes = ["electricien-irve", "aix-en-provence", "boulogne-billancourt", "clermont-ferrand", "fort-de-france", "le-havre", "le-mans", "saint-etienne", "saint-denis"];
    // Try to match metier slug by finding the last city part
    // Strategy: try splitting from the end
    const parts = s.split("-");
    for (let i = parts.length - 1; i >= 1; i--) {
      const villeCandidate = parts.slice(i).join("-");
      const metierCandidate = parts.slice(0, i).join("-");
      // Return first reasonable split
      if (metierCandidate.length > 0 && villeCandidate.length > 0) {
        return { metierSlug: metierCandidate, villeSlug: villeCandidate };
      }
    }
    return { metierSlug: s, villeSlug: "" };
  };

  // We need to try multiple splits to find valid ones
  const allSplits = (() => {
    if (!slug) return [];
    const parts = slug.split("-");
    const splits = [];
    for (let i = 1; i < parts.length; i++) {
      splits.push({
        metierSlug: parts.slice(0, i).join("-"),
        villeSlug: parts.slice(i).join("-"),
      });
    }
    return splits;
  })();

  // We'll use a simpler approach: fetch all metiers and cities, then match
  const { data: allMetiers } = useAllSeoMetiersForParsing();
  const { data: allCities } = useAllSeoCitiesForParsing();

  const matched = (() => {
    if (!allMetiers || !allCities || !slug) return null;
    for (const split of allSplits) {
      const m = allMetiers.find((x) => x.slug === split.metierSlug);
      const c = allCities.find((x) => x.slug === split.villeSlug);
      if (m && c) return { metier: m, city: c };
    }
    return null;
  })();

  const metier = matched?.metier;
  const city = matched?.city;

  const { data: artisans, isLoading } = useSeoArtisans(metier, city);
  const { data: nearbyCities } = useNearbyCities(city);
  const { data: relatedMetiers } = useRelatedMetiers(metier);
  const { data: categories } = useCategories();

  const artisanCount = artisans?.length || 0;
  const isEnergyMetier = metier ? ENERGY_SLUGS.includes(metier.slug) || metier.is_rge_eligible : false;

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId || !categories) return metier?.name || "Artisan";
    return categories.find((c) => c.id === categoryId)?.name || metier?.name || "Artisan";
  };

  if (!slug) return null;

  // While loading metiers/cities for parsing
  if (!allMetiers || !allCities) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!metier || !city) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-32 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Page non trouvée</h1>
          <p className="text-muted-foreground mb-6">Cette combinaison métier-ville n'existe pas encore.</p>
          <Link to="/artisans">
            <Button>Voir tous les artisans</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const pageTitle = `${metier.name} à ${city.name} — Artisans vérifiés, devis gratuit`;
  const pageDescription = `Trouvez un ${metier.name.toLowerCase()} vérifié à ${city.name}. Artisans audités, assurances contrôlées, devis gratuit sous 2h. ${artisanCount} professionnels disponibles.`;
  const canonicalUrl = `https://artisansvalides.fr/artisans/${metier.slug}-${city.slug}`;

  const faqItems = [
    {
      q: `Quel est le prix d'un ${metier.name.toLowerCase()} à ${city.name} ?`,
      a: `Le prix d'un ${metier.name.toLowerCase()} à ${city.name} varie selon la nature des travaux, la surface et les matériaux. Demandez un devis gratuit sur Artisans Validés pour obtenir une estimation précise de professionnels vérifiés.`,
    },
    {
      q: `Comment choisir un bon ${metier.name.toLowerCase()} à ${city.name} ?`,
      a: `Sur Artisans Validés, tous les ${metier.name.toLowerCase()}s à ${city.name} sont audités sur le terrain. Nous vérifions les assurances décennales, les qualifications et les avis clients pour vous garantir un professionnel de confiance.`,
    },
    {
      q: `Quels ${metier.name.toLowerCase()}s sont disponibles à ${city.name} ?`,
      a: `Actuellement, ${artisanCount} ${metier.name.toLowerCase()}${artisanCount > 1 ? "s" : ""} vérifié${artisanCount > 1 ? "s" : ""} ${artisanCount > 1 ? "sont" : "est"} disponible${artisanCount > 1 ? "s" : ""} à ${city.name} et ses environs sur Artisans Validés.`,
    },
    {
      q: `Comment obtenir un devis ${metier.name.toLowerCase()} gratuit à ${city.name} ?`,
      a: `Déposez votre projet gratuitement sur Artisans Validés. Les ${metier.name.toLowerCase()}s vérifiés de ${city.name} vous enverront leurs devis sous 2h en moyenne. Sans engagement.`,
    },
    ...(isEnergyMetier
      ? [
          {
            q: `Quelles aides pour ${metier.name.toLowerCase()} à ${city.name} ?`,
            a: `Les travaux de ${metier.name.toLowerCase()} à ${city.name} peuvent bénéficier de MaPrimeRénov', des CEE (Certificats d'Économies d'Énergie) et de l'éco-PTZ. Nos artisans RGE certifiés vous accompagnent dans vos démarches.`,
          },
        ]
      : []),
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle} | Artisans Validés</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="Artisans Validés" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(215 62% 6%) 0%, hsl(215 55% 12%) 100%)' }}>
          <div className="max-w-6xl mx-auto px-4 text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">
              <Users className="w-3.5 h-3.5 mr-1" />
              {artisanCount} artisan{artisanCount > 1 ? "s" : ""} vérifié{artisanCount > 1 ? "s" : ""} à {city.name}
            </Badge>

            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 font-['DM_Sans']">
              {metier.name} à {city.name} — {artisanCount} artisan{artisanCount > 1 ? "s" : ""} vérifié{artisanCount > 1 ? "s" : ""} disponible{artisanCount > 1 ? "s" : ""}
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Artisans Validés sélectionne uniquement les meilleurs professionnels de {city.name}. Audit terrain, assurances vérifiées, devis gratuit.
            </p>

            <Link to="/demande-devis">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base px-8">
                Déposer mon projet gratuitement
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Energy Aids Block */}
        {isEnergyMetier && (
          <section className="max-w-6xl mx-auto px-4 -mt-6 mb-8 relative z-10">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
              <div className="flex items-start gap-3">
                <Leaf className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-bold text-emerald-400 mb-2">
                    💰 {metier.name} à {city.name} : éligible aux aides d'État MaPrimeRénov' et CEE
                  </h2>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    <li>• <strong>MaPrimeRénov'</strong> : jusqu'à 11 000€ selon vos revenus</li>
                    <li>• <strong>CEE</strong> (Certificats d'Économies d'Énergie) : primes complémentaires</li>
                    <li>• <strong>Éco-PTZ</strong> : prêt à taux zéro jusqu'à 50 000€</li>
                    <li>• <strong>TVA réduite</strong> à 5,5% pour les travaux de rénovation énergétique</li>
                  </ul>
                  <Link to={`/trouver-artisan?rge=true`}>
                    <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                      <Shield className="w-4 h-4 mr-2" />
                      Trouver un artisan RGE certifié
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Artisans List */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {artisanCount > 0
              ? `${metier.name}${artisanCount > 1 ? "s" : ""} vérifiés à ${city.name}`
              : `${metier.name} à ${city.name}`}
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 rounded-lg bg-card animate-pulse" />
              ))}
            </div>
          ) : artisanCount > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artisans!.map((artisan) => (
                <ArtisanCard
                  key={artisan.id}
                  id={artisan.id!}
                  slug={artisan.slug}
                  name={artisan.business_name || "Artisan"}
                  profession={getCategoryName(artisan.category_id)}
                  location={artisan.city || city.name}
                  rating={Number(artisan.rating) || 0}
                  reviews={artisan.review_count || 0}
                  verified={artisan.is_verified || false}
                  experience={`${artisan.experience_years || 0} ans`}
                  profileImage={artisan.photo_url || undefined}
                  portfolio={artisan.portfolio_images || undefined}
                  portfolioVideos={artisan.portfolio_videos || undefined}
                  subscriptionTier={artisan.subscription_tier}
                  isAudited={artisan.is_audited || false}
                  isRge={artisan.is_rge || false}
                  availableUrgent={artisan.available_urgent || false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-border bg-card/50">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Pas encore d'artisan certifié à {city.name}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Déposez votre projet, nous vous prévenons dès qu'un {metier.name.toLowerCase()} est validé dans votre zone.
              </p>
              <Link to="/demande-devis">
                <Button className="bg-primary text-primary-foreground">
                  Déposer mon projet
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Questions fréquentes — {metier.name} à {city.name}
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 bg-card/50">
                <AccordionTrigger className="text-left text-foreground font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Internal Links */}
        <section className="max-w-6xl mx-auto px-4 py-12 border-t border-border">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Nearby Cities */}
            {nearbyCities && nearbyCities.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">
                  {metier.name} dans les villes voisines
                </h3>
                <ul className="space-y-2">
                  {nearbyCities.map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/artisans/${metier.slug}-${c.slug}`}
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {metier.name} à {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Métiers */}
            {relatedMetiers && relatedMetiers.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Autres métiers à {city.name}
                </h3>
                <ul className="space-y-2">
                  {relatedMetiers.map((m) => (
                    <li key={m.id}>
                      <Link
                        to={`/artisans/${m.slug}-${city.slug}`}
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {m.name} à {city.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// Internal hooks for parsing - fetch all data to resolve slug
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SeoCity, SeoMetier } from "@/hooks/useSeoData";

const useAllSeoMetiersForParsing = () => {
  return useQuery({
    queryKey: ["seo-metiers-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_metiers")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as SeoMetier[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

const useAllSeoCitiesForParsing = () => {
  return useQuery({
    queryKey: ["seo-cities-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_cities")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as SeoCity[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

export default ArtisansSeoPage;
