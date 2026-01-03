import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ExternalLink, Shield, Wrench, GraduationCap, Truck, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Ad {
  id: string;
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
  sponsor: string;
}

const fakeAds: Ad[] = [
  {
    id: "1",
    title: "Assurance décennale -30%",
    description: "Protection complète pour vos chantiers. Devis gratuit en 2 min.",
    cta: "Obtenir un devis",
    icon: <Shield className="w-10 h-10" />,
    gradient: "from-blue-600 to-blue-800",
    accentColor: "bg-blue-500",
    sponsor: "ProtectArtisan",
  },
  {
    id: "2",
    title: "Outillage Pro -20%",
    description: "Équipement professionnel de qualité. Livraison offerte dès 150€.",
    cta: "Voir les offres",
    icon: <Wrench className="w-10 h-10" />,
    gradient: "from-orange-500 to-red-600",
    accentColor: "bg-orange-500",
    sponsor: "BricoProShop",
  },
  {
    id: "3",
    title: "Formations certifiantes",
    description: "Montez en compétences avec nos formations éligibles CPF.",
    cta: "Découvrir",
    icon: <GraduationCap className="w-10 h-10" />,
    gradient: "from-emerald-500 to-teal-600",
    accentColor: "bg-emerald-500",
    sponsor: "ArtisanAcademy",
  },
  {
    id: "4",
    title: "Utilitaires en leasing",
    description: "Véhicules neufs à partir de 299€/mois. Entretien inclus.",
    cta: "Simuler",
    icon: <Truck className="w-10 h-10" />,
    gradient: "from-violet-500 to-purple-700",
    accentColor: "bg-violet-500",
    sponsor: "ProVan",
  },
  {
    id: "5",
    title: "Comptabilité simplifiée",
    description: "Gérez vos devis et factures en un clic. Essai gratuit 30 jours.",
    cta: "Essayer",
    icon: <Calculator className="w-10 h-10" />,
    gradient: "from-slate-600 to-slate-800",
    accentColor: "bg-slate-500",
    sponsor: "ComptaSimple",
  },
];

const AdCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (!emblaApi) return;
    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(autoplay);
  }, [emblaApi]);

  return (
    <div className="relative">
      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {fakeAds.map((ad) => (
            <div
              key={ad.id}
              className="pl-4 min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3"
            >
              <div
                className={cn(
                  "relative h-52 rounded-xl overflow-hidden bg-gradient-to-br",
                  ad.gradient
                )}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
                  <div className="absolute bottom-4 left-4 w-24 h-24 border-2 border-white rounded-full" />
                </div>

                {/* Content */}
                <div className="relative h-full p-6 flex flex-col justify-between">
                  {/* Top: Badge + Icon */}
                  <div className="flex items-start justify-between">
                    <Badge 
                      variant="secondary" 
                      className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm"
                    >
                      Sponsorisé
                    </Badge>
                    <div className="text-white/80">
                      {ad.icon}
                    </div>
                  </div>

                  {/* Bottom: Text + CTA */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/70 text-xs font-medium mb-1">{ad.sponsor}</p>
                      <h3 className="text-white font-bold text-lg leading-tight">{ad.title}</h3>
                      <p className="text-white/80 text-sm mt-1 line-clamp-2">{ad.description}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-white text-foreground hover:bg-white/90 font-semibold"
                    >
                      {ad.cta}
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="outline"
        size="icon"
        onClick={scrollPrev}
        className="absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/95 backdrop-blur-sm shadow-lg border-border hover:bg-muted hidden md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={scrollNext}
        className="absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/95 backdrop-blur-sm shadow-lg border-border hover:bg-muted hidden md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {fakeAds.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === selectedIndex
                ? "bg-gold w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default AdCarousel;
