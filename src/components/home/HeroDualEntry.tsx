import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Home, ShieldCheck, ArrowRight, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
import { CityAutocomplete } from "@/components/location/CityAutocomplete";

const HeroDualEntry = () => {
  const navigate = useNavigate();
  const { data: categories } = useCategoriesHierarchy();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [ville, setVille] = useState("");
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  const handleParticulierSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (ville) params.set("ville", ville);
    navigate(`/trouver-artisan?${params.toString()}`);
  };

  const selectedCatName = categories
    ?.flatMap(p => [p, ...p.children])
    .find(c => c.id === selectedCategory)?.name;

  return (
    <section className="relative bg-background pt-24 md:pt-32 pb-10 md:pb-16 overflow-hidden">
      {/* Background image + dark overlay */}
      <div className="absolute inset-0">
        <img
          src="https://cstxrauedasufcecaouq.supabase.co/storage/v1/object/public/public/hero-artisan-bg.jpg"
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-[rgba(10,15,28,0.55)]" />
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[140px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* PARTIE HAUTE — Accroche universelle */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto mb-12 md:mb-16"
        >
          <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-black text-white leading-[1.15] tracking-tight mb-6">
            La plateforme qui met fin au{" "}
            <span className="relative inline-block">
              <span className="text-white">hasard</span>
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-full" />
            </span>{" "}
            dans le bâtiment.
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Pour les particuliers qui veulent un artisan de confiance.
            <br className="hidden sm:block" />
            Pour les artisans qui veulent des clients qualifiés.
          </p>
        </motion.div>

        {/* PARTIE BASSE — Deux cards */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Card Particuliers */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl border border-border bg-secondary/50 p-6 md:p-8 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Je cherche un artisan</h2>
            <p className="text-sm text-white/90 mb-6 leading-relaxed">
              1 artisan audité. Vos coordonnées protégées. Vous décidez de tout.
            </p>

            <form onSubmit={handleParticulierSearch} className="space-y-3 mt-auto">
              {/* Category dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-background border border-border text-sm text-foreground hover:border-primary/30 transition-colors"
                >
                  <span className={selectedCatName ? "text-foreground" : "text-muted-foreground"}>
                    {selectedCatName || "Quel métier ?"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                {catDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-[250px] overflow-y-auto">
                    {categories?.map(parent => (
                      <div key={parent.id}>
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {parent.name}
                        </div>
                        {parent.children.map(child => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(child.id);
                              setCatDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent/10 transition-colors"
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* City autocomplete */}
              <CityAutocomplete
                value={ville}
                onChange={setVille}
                placeholder="Votre ville"
                className="[&_input]:bg-background [&_input]:border-border [&_input]:text-foreground"
              />

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold min-h-[48px] md:min-h-[52px] btn-shine"
              >
                Trouver mon artisan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </motion.div>

          {/* Card Artisans */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-secondary/50 to-primary/5 p-6 md:p-8 flex flex-col"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Je suis artisan</h2>
            <p className="text-sm text-white/90 mb-6 leading-relaxed">
              Devenez le seul artisan de votre métier sur votre secteur. Zéro commission.
            </p>

            <div className="mt-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-white font-bold">
                <Zap className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-bold text-white">
                  ⚡ Places limitées dans votre ville
                </span>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold min-h-[48px] md:min-h-[52px]"
                asChild
              >
                <Link to="/devenir-partenaire">
                  Vérifier mon secteur
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroDualEntry;
