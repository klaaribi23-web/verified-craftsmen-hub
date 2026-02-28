import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Leaf } from "lucide-react";
import { useCategoriesWithCount } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/categories/CategoryIcon";

const RGE_CATEGORIES = [
  "Photovoltaïque",
  "Isolation",
  "PAC",
  "Chauffage",
  "Borne IRVE",
  "Menuiserie extérieure",
  "Menuiseries & Fermetures",
  "Énergies & Équipements",
];

const EnhancedCategories = () => {
  const { data: categories, isLoading } = useCategoriesWithCount();

  const allCats = categories || [];

  return (
    <section className="py-14 lg:py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Tous les métiers du bâtiment,
            <br className="hidden sm:block" />
            vérifiés et certifiés
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sélectionnez le corps de métier dont vous avez besoin.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-5">
            {allCats.map((category, index) => {
              const isRge = RGE_CATEGORIES.some(
                (r) => category.name.toLowerCase().includes(r.toLowerCase())
              );
              const hasArtisans = category.count > 0;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                >
                  {hasArtisans ? (
                    <Link
                      to={`/trouver-artisan?category=${category.id}`}
                      className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all duration-300 h-full card-hover"
                    >
                      <div className="flex items-start justify-between mb-3">
                         <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <CategoryIcon iconName={category.icon} className="w-5 h-5 text-white" />
                        </div>
                        {isRge && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                            <Leaf className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">RGE</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-white transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {category.count} artisan{category.count !== 1 ? "s" : ""}
                      </p>
                    </Link>
                  ) : (
                    <div className="block rounded-xl border border-border bg-card p-3 md:p-5 opacity-50 h-full">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                        <CategoryIcon iconName={category.icon} className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">{category.name}</h3>
                      <span className="text-[10px] text-muted-foreground break-words">Bientôt disponible</span>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* All categories card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link
                to="/trouver-artisan"
                className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all duration-300 h-full card-hover"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-white transition-colors">
                  Tous les métiers
                </h3>
                <p className="text-xs text-muted-foreground">Voir l'annuaire complet</p>
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EnhancedCategories;
