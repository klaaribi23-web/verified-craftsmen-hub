import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Gift, 
  Percent, 
  ExternalLink,
  Tag,
  Building2,
  Wrench
} from "lucide-react";

const partnerOffers = [
  {
    id: 1,
    partner: "Leroy Merlin",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/LeroyMerlin.svg/1200px-LeroyMerlin.svg.png",
    discount: "-20%",
    description: "Profitez de 20% de réduction sur tous les matériaux de plomberie, chauffage et électricité",
    category: "Matériaux",
    validUntil: "31/12/2024",
    code: "ARTISANVALIDE20"
  },
  {
    id: 2,
    partner: "Mr Bricolage",
    logo: "https://upload.wikimedia.org/wikipedia/fr/thumb/5/53/Logo_Mr._Bricolage.svg/1200px-Logo_Mr._Bricolage.svg.png",
    discount: "-15%",
    description: "15% de remise sur l'outillage professionnel et les équipements de protection",
    category: "Outillage",
    validUntil: "31/12/2024",
    code: "MRBRICO15"
  },
  {
    id: 3,
    partner: "Point P",
    logo: "https://upload.wikimedia.org/wikipedia/fr/thumb/0/05/Point.P_logo.svg/1200px-Point.P_logo.svg.png",
    discount: "-25%",
    description: "25% de réduction sur les commandes de matériaux de construction",
    category: "Matériaux",
    validUntil: "30/06/2025",
    code: "POINTP25PRO"
  },
  {
    id: 4,
    partner: "Brico Dépôt",
    logo: "https://upload.wikimedia.org/wikipedia/fr/thumb/0/0f/Brico_D%C3%A9p%C3%B4t_logo.svg/1200px-Brico_D%C3%A9p%C3%B4t_logo.svg.png",
    discount: "-18%",
    description: "18% sur toute la gamme sanitaire et robinetterie professionnelle",
    category: "Sanitaire",
    validUntil: "31/03/2025",
    code: "BRICODEPOT18"
  },
  {
    id: 5,
    partner: "Würth",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/W%C3%BCrth_Logo_2010.svg/1200px-W%C3%BCrth_Logo_2010.svg.png",
    discount: "-22%",
    description: "22% de remise sur les fixations, visserie et outillage électroportatif",
    category: "Outillage",
    validUntil: "31/12/2024",
    code: "WURTH22"
  },
  {
    id: 6,
    partner: "Kiloutou",
    logo: "https://upload.wikimedia.org/wikipedia/fr/5/5a/Logo-kiloutou.png",
    discount: "-30%",
    description: "30% sur la location de matériel professionnel (échafaudages, engins, etc.)",
    category: "Location",
    validUntil: "31/12/2024",
    code: "KILOU30PRO"
  },
  {
    id: 7,
    partner: "Castorama",
    logo: "https://upload.wikimedia.org/wikipedia/fr/thumb/4/44/Castorama_logo.svg/1200px-Castorama_logo.svg.png",
    discount: "-12%",
    description: "12% sur les peintures, revêtements et décoration professionnelle",
    category: "Peinture",
    validUntil: "28/02/2025",
    code: "CASTO12PRO"
  },
  {
    id: 8,
    partner: "Cedeo",
    logo: "https://www.cedeo.fr/themes/custom/cedeo/logo.svg",
    discount: "-20%",
    description: "20% de remise sur les équipements de chauffage et climatisation",
    category: "Chauffage",
    validUntil: "31/12/2024",
    code: "CEDEO20"
  }
];

export const ArtisanPartnerOffers = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <ArtisanSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Offres Partenaires" 
          subtitle="Profitez de réductions exclusives chez nos partenaires"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* Introduction */}
            <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent/20">
                    <Gift className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                      Vos avantages exclusifs
                    </h2>
                    <p className="text-muted-foreground">
                      En tant qu'artisan validé sur notre plateforme, vous bénéficiez de réductions 
                      exclusives chez nos partenaires. Utilisez les codes promo ci-dessous lors de 
                      vos achats en magasin ou en ligne.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Partner Offers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partnerOffers.map((offer) => (
                <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="h-12 flex items-center">
                        <img 
                          src={offer.logo} 
                          alt={offer.partner}
                          className="h-8 object-contain max-w-[120px]"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <span className="hidden font-bold text-lg">{offer.partner}</span>
                      </div>
                      <Badge className="bg-accent text-accent-foreground font-bold text-lg px-3 py-1">
                        {offer.discount}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          <Tag className="w-3 h-3 mr-1" />
                          {offer.category}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {offer.description}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Code promo</p>
                        <p className="font-mono font-bold text-foreground">{offer.code}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Valide jusqu'au {offer.validUntil}</span>
                        <Button variant="ghost" size="sm" className="text-primary">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Voir l'offre
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Bottom Info */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    <span>{partnerOffers.length} partenaires</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    <span>Jusqu'à 30% de réduction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    <span>Offres réservées aux artisans validés</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};
