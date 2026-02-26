import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAllSeoCities, useAllSeoMetiers } from "@/hooks/useSeoData";
import { MapPin, Wrench } from "lucide-react";

const ArtisansSeoIndex = () => {
  const { data: cities, isLoading: citiesLoading } = useAllSeoCities();
  const { data: metiers, isLoading: metiersLoading } = useAllSeoMetiers();

  const isLoading = citiesLoading || metiersLoading;

  // Group cities by region
  const citiesByRegion = (cities || []).reduce<Record<string, typeof cities>>((acc, city) => {
    const region = city.region || "Autre";
    if (!acc[region]) acc[region] = [];
    acc[region]!.push(city);
    return acc;
  }, {});

  const regions = Object.keys(citiesByRegion).sort();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Trouver un artisan par métier et ville | Artisans Validés</title>
        <meta
          name="description"
          content="Annuaire des artisans vérifiés par métier et par ville en France. Plombier, électricien, couvreur, isolation... Trouvez un professionnel audité près de chez vous."
        />
        <link rel="canonical" href="https://artisansvalides.fr/artisans" />
      </Helmet>

      <Navbar />

      <main className="pt-20 pb-16">
        {/* Hero */}
        <section className="py-12 md:py-20" style={{ background: 'linear-gradient(180deg, hsl(215 62% 6%) 0%, hsl(215 55% 12%) 100%)' }}>
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 font-['DM_Sans']">
              Trouvez un artisan vérifié par métier et par ville
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {metiers?.length || 0} métiers × {cities?.length || 0} villes — Des artisans audités sur le terrain, partout en France.
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <section className="max-w-6xl mx-auto px-4 py-12">
            {/* Métiers list */}
            <div className="mb-12">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Nos métiers
              </h2>
              <div className="flex flex-wrap gap-2">
                {metiers?.map((m) => (
                  <span key={m.id} className="px-3 py-1.5 rounded-full text-sm font-medium bg-card border border-border text-foreground">
                    {m.name}
                    {m.is_rge_eligible && <span className="ml-1 text-emerald-400 text-xs">RGE</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* By region */}
            {regions.map((region) => (
              <div key={region} className="mb-10">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {region}
                </h2>
                <div className="space-y-6">
                  {citiesByRegion[region]!.map((city) => (
                    <div key={city.id}>
                      <h3 className="text-base font-semibold text-foreground mb-2">{city.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {metiers?.map((m) => (
                          <Link
                            key={`${m.slug}-${city.slug}`}
                            to={`/artisans/${m.slug}-${city.slug}`}
                            className="text-xs px-2.5 py-1 rounded-md bg-secondary/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                          >
                            {m.name} à {city.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ArtisansSeoIndex;
