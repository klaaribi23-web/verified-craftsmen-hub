import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Star, 
  CheckCircle2, 
  Filter,
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
  { icon: Droplets, title: "Plombier", count: 847, href: "/artisans/plombier" },
  { icon: Zap, title: "Électricien", count: 623, href: "/artisans/electricien" },
  { icon: Flame, title: "Chauffagiste", count: 412, href: "/artisans/chauffagiste" },
  { icon: Paintbrush, title: "Peintre", count: 956, href: "/artisans/peintre" },
  { icon: Key, title: "Serrurier", count: 234, href: "/artisans/serrurier" },
  { icon: Construction, title: "Maçon", count: 378, href: "/artisans/macon" },
  { icon: Hammer, title: "Menuisier", count: 289, href: "/artisans/menuisier" },
  { icon: Wrench, title: "Carreleur", count: 445, href: "/artisans/carreleur" },
];

const featuredArtisans = [
  {
    id: 1,
    name: "Jean-Pierre Martin",
    profession: "Plombier",
    location: "Paris 15ème",
    rating: 4.9,
    reviews: 127,
    verified: true,
    experience: "15 ans",
    hourlyRate: "45€",
  },
  {
    id: 2,
    name: "Marc Dubois",
    profession: "Électricien",
    location: "Lyon 6ème",
    rating: 4.8,
    reviews: 89,
    verified: true,
    experience: "12 ans",
    hourlyRate: "50€",
  },
  {
    id: 3,
    name: "Sophie Laurent",
    profession: "Peintre",
    location: "Marseille",
    rating: 4.9,
    reviews: 156,
    verified: true,
    experience: "10 ans",
    hourlyRate: "40€",
  },
];

const TrouverArtisan = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Search */}
        <section className="bg-navy py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Trouvez votre <span className="text-gradient-gold">artisan</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Plus de 5000 artisans vérifiés à votre service
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-2xl p-3 shadow-floating flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Quel artisan recherchez-vous ?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-0 bg-muted text-base"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Ville ou code postal"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-12 h-12 border-0 bg-muted text-base"
                  />
                </div>
                <Button variant="gold" size="lg" className="h-12 px-8">
                  <Search className="w-5 h-5 mr-2" />
                  Rechercher
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-2xl font-bold text-navy mb-8">Parcourir par métier</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={category.href}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-gold/30 hover:shadow-soft transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <category.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <div className="font-semibold text-navy group-hover:text-gold transition-colors">
                        {category.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.count} artisans
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Artisans */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-navy">Artisans recommandés</h2>
              <Button variant="ghost" className="text-gold">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredArtisans.map((artisan, index) => (
                <motion.div
                  key={artisan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-soft border border-border hover:shadow-elevated transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-gold flex items-center justify-center text-navy-dark font-bold text-xl">
                      {artisan.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-navy">{artisan.name}</h3>
                        {artisan.verified && (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{artisan.profession}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{artisan.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-gold text-gold" />
                      <span className="font-semibold text-navy">{artisan.rating}</span>
                      <span className="text-sm text-muted-foreground">({artisan.reviews})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <div className="text-xs text-muted-foreground">Expérience</div>
                      <div className="font-semibold text-navy">{artisan.experience}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <div className="text-xs text-muted-foreground">Tarif/h</div>
                      <div className="font-semibold text-navy">{artisan.hourlyRate}</div>
                    </div>
                  </div>

                  <Button variant="gold" className="w-full">
                    Demander un devis
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="bg-gradient-gold rounded-3xl p-8 lg:p-12 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-navy-dark mb-4">
                Vous ne trouvez pas ce que vous cherchez ?
              </h2>
              <p className="text-navy-dark/70 mb-8 max-w-xl mx-auto">
                Décrivez votre projet et nous vous mettrons en relation avec les artisans les plus adaptés.
              </p>
              <Button variant="default" size="lg" asChild>
                <Link to="/demande-devis">
                  Déposer une demande de devis
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

export default TrouverArtisan;
