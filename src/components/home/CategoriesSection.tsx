import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useCategoriesWithCount } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/categories/CategoryIcon";

// Color gradients for parent categories
const categoryColors: Record<string, string> = {
  "Gros œuvre & Construction": "from-amber-500 to-amber-600",
  "Second œuvre": "from-blue-500 to-blue-600",
  "Menuiseries & Fermetures": "from-emerald-500 to-emerald-600",
  "Extérieur & Aménagement": "from-green-500 to-green-600",
  "Entretien & Dépannage": "from-red-500 to-red-600",
  "Rénovation & Décoration": "from-purple-500 to-pink-500",
  "Énergies & Équipements": "from-yellow-500 to-orange-500",
  "Artisans spécialisés": "from-indigo-500 to-indigo-600",
  "Services liés au bâtiment": "from-slate-500 to-slate-600"
};
const CategoriesSection = () => {
  const {
    data: categories,
    isLoading
  } = useCategoriesWithCount();

  // Take first 8 categories for display, add "All" as last
  const displayCategories = categories?.slice(0, 7) || [];
  return <section className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            Nos métiers
          </span>
          <h2 className="text-xl md:text-4xl lg:text-5xl font-bold text-navy mb-4 ">
            Quel artisan recherchez-vous ?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Sélectionnez le corps de métier dont vous avez besoin et trouvez 
            rapidement un professionnel qualifié près de chez vous.
          </p>
        </motion.div>

        {/* Categories Grid */}
        {isLoading ? <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {displayCategories.map((category, index) => <motion.div key={category.id} initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: index * 0.05
        }}>
                <Link to={`/trouver-artisan?category=${category.id}`} className="group block bg-white rounded-2xl border border-border p-6 hover:shadow-elevated hover:border-gold/30 transition-all duration-300 h-full">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColors[category.name] || "from-navy to-navy-light"} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <CategoryIcon iconName={category.icon} className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-navy text-lg mb-2 group-hover:text-gold transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {category.count} artisan{category.count !== 1 ? "s" : ""} disponible{category.count !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-1 mt-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-medium">Voir les artisans</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>)}

            {/* "All categories" card */}
            <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.35
        }}>
              <Link to="/trouver-artisan" className="group block bg-white rounded-2xl border border-border p-6 hover:shadow-elevated hover:border-gold/30 transition-all duration-300 h-full">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-navy to-navy-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ArrowRight className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-navy text-lg mb-2 group-hover:text-gold transition-colors">
                  Tous les métiers
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Découvrez tous nos artisans qualifiés
                </p>
                <div className="flex items-center gap-1 mt-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">Voir tous</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          </div>}
      </div>
    </section>;
};
export default CategoriesSection;