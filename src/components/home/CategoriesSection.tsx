import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Droplets, 
  Zap, 
  Flame, 
  Paintbrush, 
  Key, 
  Construction,
  Hammer,
  Wrench,
  ArrowRight
} from "lucide-react";

const categories = [
  {
    icon: Droplets,
    title: "Plombier",
    description: "Fuites, installations, rénovation salle de bain",
    href: "/artisans/plombier",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Zap,
    title: "Électricien",
    description: "Installations, dépannages, mise aux normes",
    href: "/artisans/electricien",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Flame,
    title: "Chauffagiste",
    description: "Chaudières, pompes à chaleur, climatisation",
    href: "/artisans/chauffagiste",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Paintbrush,
    title: "Peintre",
    description: "Peinture intérieure, extérieure, décoration",
    href: "/artisans/peintre",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Key,
    title: "Serrurier",
    description: "Ouverture de porte, blindage, serrures",
    href: "/artisans/serrurier",
    color: "from-slate-500 to-slate-600",
  },
  {
    icon: Construction,
    title: "Maçon",
    description: "Construction, rénovation, extension",
    href: "/artisans/macon",
    color: "from-amber-500 to-amber-600",
  },
  {
    icon: Hammer,
    title: "Menuisier",
    description: "Portes, fenêtres, meubles sur mesure",
    href: "/artisans/menuisier",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: Wrench,
    title: "Tous les métiers",
    description: "Découvrez tous nos artisans qualifiés",
    href: "/trouver-artisan",
    color: "from-navy to-navy-light",
  },
];

const CategoriesSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            Nos métiers
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4">
            Quel artisan recherchez-vous ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sélectionnez le corps de métier dont vous avez besoin et trouvez 
            rapidement un professionnel qualifié près de chez vous.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={category.href}
                className="group block bg-white rounded-2xl border border-border p-6 hover:shadow-elevated hover:border-gold/30 transition-all duration-300 h-full"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-navy text-lg mb-2 group-hover:text-gold transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {category.description}
                </p>
                <div className="flex items-center gap-1 mt-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">Voir les artisans</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
