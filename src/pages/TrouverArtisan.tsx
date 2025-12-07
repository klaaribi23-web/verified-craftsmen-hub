import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import ArtisanFilters from "@/components/artisan-search/ArtisanFilters";
import ArtisanCard from "@/components/artisan-search/ArtisanCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Search, 
  MapPin, 
  Star,
  CheckCircle2,
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

// All artisans data (dummy data for pagination demo)
const allArtisansData = [
  { id: 4, name: "Pierre Lefebvre", profession: "Plombier", location: "Bordeaux (33)", rating: 4.7, reviews: 98, verified: true, experience: "8 ans", hourlyRate: "42€" },
  { id: 5, name: "Marie Dupont", profession: "Électricien", location: "Nantes (44)", rating: 4.6, reviews: 67, verified: true, experience: "6 ans", hourlyRate: "48€" },
  { id: 6, name: "Lucas Bernard", profession: "Chauffagiste", location: "Toulouse (31)", rating: 4.9, reviews: 134, verified: true, experience: "14 ans", hourlyRate: "55€" },
  { id: 7, name: "Emma Moreau", profession: "Peintre", location: "Nice (06)", rating: 4.8, reviews: 89, verified: true, experience: "9 ans", hourlyRate: "38€" },
  { id: 8, name: "Thomas Petit", profession: "Serrurier", location: "Lyon (69)", rating: 4.5, reviews: 45, verified: true, experience: "5 ans", hourlyRate: "52€" },
  { id: 9, name: "Camille Roux", profession: "Maçon", location: "Marseille (13)", rating: 4.7, reviews: 78, verified: true, experience: "11 ans", hourlyRate: "50€" },
  { id: 10, name: "Antoine Girard", profession: "Menuisier", location: "Strasbourg (67)", rating: 4.9, reviews: 112, verified: true, experience: "15 ans", hourlyRate: "58€" },
  { id: 11, name: "Julie Fontaine", profession: "Carreleur", location: "Montpellier (34)", rating: 4.6, reviews: 56, verified: true, experience: "7 ans", hourlyRate: "44€" },
  { id: 12, name: "Nicolas Lambert", profession: "Plombier", location: "Lille (59)", rating: 4.8, reviews: 91, verified: true, experience: "10 ans", hourlyRate: "46€" },
  { id: 13, name: "Laura Michel", profession: "Électricien", location: "Rennes (35)", rating: 4.7, reviews: 73, verified: true, experience: "8 ans", hourlyRate: "49€" },
  { id: 14, name: "Julien Mercier", profession: "Chauffagiste", location: "Grenoble (38)", rating: 4.5, reviews: 42, verified: true, experience: "6 ans", hourlyRate: "53€" },
  { id: 15, name: "Claire Bonnet", profession: "Peintre", location: "Dijon (21)", rating: 4.9, reviews: 145, verified: true, experience: "12 ans", hourlyRate: "41€" },
  { id: 16, name: "Maxime Dumont", profession: "Serrurier", location: "Angers (49)", rating: 4.6, reviews: 58, verified: true, experience: "7 ans", hourlyRate: "50€" },
  { id: 17, name: "Sarah Leroy", profession: "Maçon", location: "Nîmes (30)", rating: 4.8, reviews: 87, verified: true, experience: "9 ans", hourlyRate: "48€" },
  { id: 18, name: "David Simon", profession: "Menuisier", location: "Toulon (83)", rating: 4.7, reviews: 69, verified: true, experience: "10 ans", hourlyRate: "56€" },
  { id: 19, name: "Léa Martin", profession: "Carreleur", location: "Le Havre (76)", rating: 4.5, reviews: 38, verified: true, experience: "5 ans", hourlyRate: "43€" },
  { id: 20, name: "Romain Faure", profession: "Plombier", location: "Clermont-Ferrand (63)", rating: 4.9, reviews: 118, verified: true, experience: "13 ans", hourlyRate: "47€" },
  { id: 21, name: "Pauline Blanc", profession: "Électricien", location: "Reims (51)", rating: 4.6, reviews: 52, verified: true, experience: "6 ans", hourlyRate: "51€" },
  { id: 22, name: "Sébastien Garnier", profession: "Chauffagiste", location: "Saint-Étienne (42)", rating: 4.8, reviews: 94, verified: true, experience: "11 ans", hourlyRate: "54€" },
  { id: 23, name: "Manon Perrin", profession: "Peintre", location: "Paris (75)", rating: 4.7, reviews: 76, verified: true, experience: "8 ans", hourlyRate: "39€" },
  { id: 24, name: "Florian Morel", profession: "Serrurier", location: "Bordeaux (33)", rating: 4.5, reviews: 41, verified: true, experience: "5 ans", hourlyRate: "49€" },
  { id: 25, name: "Océane Rousseau", profession: "Maçon", location: "Lyon (69)", rating: 4.9, reviews: 129, verified: true, experience: "14 ans", hourlyRate: "52€" },
  { id: 26, name: "Hugo Chevalier", profession: "Menuisier", location: "Nantes (44)", rating: 4.6, reviews: 63, verified: true, experience: "7 ans", hourlyRate: "57€" },
  { id: 27, name: "Chloé Muller", profession: "Carreleur", location: "Toulouse (31)", rating: 4.8, reviews: 85, verified: true, experience: "9 ans", hourlyRate: "45€" },
  { id: 28, name: "Alexandre Fournier", profession: "Plombier", location: "Nice (06)", rating: 4.7, reviews: 71, verified: true, experience: "10 ans", hourlyRate: "44€" },
  { id: 29, name: "Mathilde Giraud", profession: "Électricien", location: "Marseille (13)", rating: 4.5, reviews: 47, verified: true, experience: "6 ans", hourlyRate: "50€" },
  { id: 30, name: "Vincent Andre", profession: "Chauffagiste", location: "Strasbourg (67)", rating: 4.9, reviews: 136, verified: true, experience: "15 ans", hourlyRate: "56€" },
  { id: 31, name: "Amélie Henry", profession: "Peintre", location: "Montpellier (34)", rating: 4.6, reviews: 59, verified: true, experience: "7 ans", hourlyRate: "40€" },
  { id: 32, name: "Théo Robert", profession: "Serrurier", location: "Lille (59)", rating: 4.8, reviews: 88, verified: true, experience: "9 ans", hourlyRate: "51€" },
  { id: 33, name: "Inès David", profession: "Maçon", location: "Rennes (35)", rating: 4.7, reviews: 74, verified: true, experience: "10 ans", hourlyRate: "49€" },
  { id: 34, name: "Quentin Bertrand", profession: "Menuisier", location: "Grenoble (38)", rating: 4.5, reviews: 39, verified: true, experience: "5 ans", hourlyRate: "55€" },
  { id: 35, name: "Charlotte Morin", profession: "Carreleur", location: "Dijon (21)", rating: 4.9, reviews: 121, verified: true, experience: "12 ans", hourlyRate: "46€" },
  { id: 36, name: "Adrien Laurent", profession: "Plombier", location: "Angers (49)", rating: 4.6, reviews: 54, verified: true, experience: "6 ans", hourlyRate: "43€" },
  { id: 37, name: "Élodie Clément", profession: "Électricien", location: "Nîmes (30)", rating: 4.8, reviews: 92, verified: true, experience: "11 ans", hourlyRate: "52€" },
  { id: 38, name: "Baptiste Garcia", profession: "Chauffagiste", location: "Toulon (83)", rating: 4.7, reviews: 68, verified: true, experience: "8 ans", hourlyRate: "53€" },
  { id: 39, name: "Marion Roche", profession: "Peintre", location: "Le Havre (76)", rating: 4.5, reviews: 43, verified: true, experience: "5 ans", hourlyRate: "37€" },
  { id: 40, name: "Dylan Lemaire", profession: "Serrurier", location: "Clermont-Ferrand (63)", rating: 4.9, reviews: 115, verified: true, experience: "13 ans", hourlyRate: "54€" },
  { id: 41, name: "Anaïs Picard", profession: "Maçon", location: "Reims (51)", rating: 4.6, reviews: 57, verified: true, experience: "7 ans", hourlyRate: "47€" },
  { id: 42, name: "Clément Dubois", profession: "Menuisier", location: "Saint-Étienne (42)", rating: 4.8, reviews: 83, verified: true, experience: "9 ans", hourlyRate: "59€" },
  { id: 43, name: "Juliette Renard", profession: "Carreleur", location: "Paris (75)", rating: 4.7, reviews: 70, verified: true, experience: "8 ans", hourlyRate: "48€" },
  { id: 44, name: "Valentin Arnaud", profession: "Plombier", location: "Bordeaux (33)", rating: 4.5, reviews: 46, verified: true, experience: "6 ans", hourlyRate: "41€" },
  { id: 45, name: "Lucie Marchand", profession: "Électricien", location: "Lyon (69)", rating: 4.9, reviews: 132, verified: true, experience: "14 ans", hourlyRate: "53€" },
];

const ITEMS_PER_PAGE = 21;

const TrouverArtisan = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    budget: [0, 50000],
    category: "",
    city: "",
  });

  const handleFiltersChange = useCallback(
    (newFilters: { budget: number[]; category: string; city: string }) => {
      setFilters(newFilters);
      setCurrentPage(1);
    },
    []
  );

  // Filter artisans based on filters
  const filteredArtisans = useMemo(() => {
    return allArtisansData.filter((artisan) => {
      // Filter by category
      if (filters.category && filters.category !== "all") {
        if (artisan.profession.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
      }

      // Filter by city
      if (filters.city) {
        if (!artisan.location.toLowerCase().includes(filters.city.toLowerCase().split(" ")[0])) {
          return false;
        }
      }

      // Filter by budget (using hourly rate as proxy)
      const rate = parseInt(artisan.hourlyRate.replace("€", ""));
      if (rate < filters.budget[0] / 1000 || rate > filters.budget[1] / 100) {
        return false;
      }

      return true;
    });
  }, [filters]);

  // Paginate filtered artisans
  const totalPages = Math.ceil(filteredArtisans.length / ITEMS_PER_PAGE);
  const paginatedArtisans = filteredArtisans.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
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
                        <Link to={`/artisan/${artisan.id}`}>
                          <h3 className="font-semibold text-navy hover:text-gold transition-colors">{artisan.name}</h3>
                        </Link>
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

                  <Button variant="gold" className="w-full" asChild>
                    <Link to={`/artisan/${artisan.id}`}>Voir le profil</Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* All Artisans with Filters */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-2xl font-bold text-navy mb-8">Tous nos artisans</h2>
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters - Left Column */}
              <div className="lg:w-80 flex-shrink-0">
                <ArtisanFilters onFiltersChange={handleFiltersChange} />
              </div>

              {/* Artisans Grid - Right Column */}
              <div className="flex-1">
                {paginatedArtisans.length > 0 ? (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      {filteredArtisans.length} artisan{filteredArtisans.length > 1 ? "s" : ""} trouvé{filteredArtisans.length > 1 ? "s" : ""}
                    </div>
                    
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                      {paginatedArtisans.map((artisan) => (
                        <motion.div
                          key={artisan.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <ArtisanCard {...artisan} />
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Aucun artisan ne correspond à vos critères</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-muted">
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
