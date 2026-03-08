import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import ArtisanCard from "@/components/artisan-search/ArtisanCard";
import DynamicFAQ from "@/components/artisan-search/DynamicFAQ";
import ExpertFAQSection from "@/components/artisan-search/ExpertFAQSection";
import { usePublicArtisans } from "@/hooks/usePublicData";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Users, Star } from "lucide-react";
import { motion } from "framer-motion";

const normalizeSlug = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const denormalizeSlug = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const CityArtisansPage = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const cityName = citySlug ? denormalizeSlug(citySlug) : "";

  const { data: artisansData, isLoading } = usePublicArtisans();
  const { data: categoriesData } = useCategoriesHierarchy();

  // Filter artisans by city (normalized match)
  const cityArtisans = useMemo(() => {
    if (!artisansData || !citySlug) return [];
    return artisansData.filter((a) => {
      const artisanCitySlug = normalizeSlug(a.city || "");
      return artisanCitySlug === citySlug;
    });
  }, [artisansData, citySlug]);

  // Get unique categories present in this city
  const cityCategories = useMemo(() => {
    const cats = new Map<string, { name: string; count: number }>();
    cityArtisans.forEach((a) => {
      const catName = a.category?.name;
      if (catName) {
        const existing = cats.get(catName);
        cats.set(catName, { name: catName, count: (existing?.count || 0) + 1 });
      }
      a.categories?.forEach((c) => {
        if (c.name) {
          const existing = cats.get(c.name);
          cats.set(c.name, { name: c.name, count: (existing?.count || 0) + 1 });
        }
      });
    });
    return Array.from(cats.values()).sort((a, b) => b.count - a.count);
  }, [cityArtisans]);

  const avgRating = useMemo(() => {
    const rated = cityArtisans.filter((a) => a.rating && a.rating > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, a) => sum + (a.rating || 0), 0) / rated.length;
  }, [cityArtisans]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`Artisans à ${cityName} – Trouvez un professionnel vérifié`}
        description={`Découvrez ${cityArtisans.length} artisans qualifiés et vérifiés à ${cityName}. Comparez les profils, consultez les avis et demandez un devis gratuit.`}
        canonical={`https://artisansvalides.fr/artisans-ville/${citySlug}`}
      />
      
      <Navbar />

      <main>
        {/* Hero */}
        <section className="bg-primary py-12 md:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-full mb-4">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="text-sm text-primary-foreground/80">{cityName}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
                Artisans vérifiés à{" "}
                <span className="text-gradient-gold">{cityName}</span>
              </h1>
              <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto mb-8">
                {cityArtisans.length} professionnel
                {cityArtisans.length > 1 ? "s" : ""} validé
                {cityArtisans.length > 1 ? "s" : ""} par notre équipe dans
                votre ville
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-6 mt-6">
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <Users className="h-5 w-5 text-accent" />
                  <span className="text-lg font-semibold text-primary-foreground">
                    {cityArtisans.length}
                  </span>
                  <span className="text-sm">artisans</span>
                </div>
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <Star className="h-5 w-5 text-accent fill-accent" />
                  <span className="text-lg font-semibold text-primary-foreground">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm">note moyenne</span>
                </div>
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <MapPin className="h-5 w-5 text-accent" />
                  <span className="text-lg font-semibold text-primary-foreground">
                    {cityCategories.length}
                  </span>
                  <span className="text-sm">métiers</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Category chips */}
        {cityCategories.length > 0 && (
          <section className="py-6 bg-muted border-b border-border">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="flex flex-wrap gap-2 justify-center">
                {cityCategories.map((cat) => (
                  <span
                    key={cat.name}
                    className="px-3 py-1.5 bg-background border border-border rounded-full text-sm text-foreground"
                  >
                    {cat.name}{" "}
                    <span className="text-muted-foreground">({cat.count})</span>
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Artisans grid */}
        <section className="py-10 md:py-16 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
              Tous les artisans à {cityName}
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-80 rounded-2xl" />
                ))}
              </div>
            ) : cityArtisans.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch gap-4 md:gap-6">
                {cityArtisans.map((artisan) => (
                  <motion.div
                    key={artisan.id}
                    className="h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ArtisanCard
                      id={artisan.id}
                      slug={artisan.slug}
                      name={artisan.business_name}
                      profession={artisan.category?.name || "Artisan"}
                      location={artisan.city}
                      rating={artisan.rating || 0}
                      reviews={artisan.review_count || 0}
                      verified={artisan.is_verified || false}
                      experience={`${artisan.experience_years || 0} ans`}
                      profileImage={artisan.photo_url || undefined}
                      portfolio={artisan.portfolio_images || undefined}
                      portfolioVideos={artisan.portfolio_videos || undefined}
                      distance={null}
                      subscriptionTier={artisan.subscription_tier}
                      phone={undefined}
                      siret={undefined}
                      facebookUrl={artisan.facebook_url}
                      instagramUrl={artisan.instagram_url}
                      linkedinUrl={artisan.linkedin_url}
                      websiteUrl={artisan.website_url}
                      isAudited={artisan.is_audited || false}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Aucun artisan trouvé à {cityName} pour le moment
                </p>
                <Button asChild variant="gold">
                  <Link to="/trouver-artisan">
                    Voir tous les artisans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Dynamic FAQ */}
        <DynamicFAQ city={cityName} />

        {/* Expert AI FAQ */}
        <ExpertFAQSection
          category={cityCategories[0]?.name || "Artisan du bâtiment"}
          city={cityName}
        />

        {/* CTA */}
        <section className="py-10 md:py-16 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="bg-gradient-gold rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 text-center">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3">
                Besoin d'un artisan à {cityName} ?
              </h2>
              <p className="text-foreground/70 mb-6 max-w-xl mx-auto text-sm md:text-base">
                Décrivez votre projet et recevez des devis de professionnels
                vérifiés près de chez vous.
              </p>
              <Button variant="default" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/demande-devis">
                  Demander un devis gratuit
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CityArtisansPage;
