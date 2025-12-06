import { useState } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Euro,
  Clock,
  GripVertical,
  CheckCircle
} from "lucide-react";

const initialServices = [
  {
    id: 1,
    name: "Dépannage plomberie urgence",
    description: "Intervention rapide pour fuites, débouchages et urgences",
    priceType: "hourly",
    price: 60,
    duration: "1-2h",
    active: true,
    popular: true,
  },
  {
    id: 2,
    name: "Installation chauffe-eau",
    description: "Installation complète de chauffe-eau électrique ou gaz",
    priceType: "fixed",
    price: 350,
    duration: "3-4h",
    active: true,
    popular: false,
  },
  {
    id: 3,
    name: "Rénovation salle de bain",
    description: "Rénovation complète : plomberie, sanitaires, carrelage",
    priceType: "quote",
    price: null,
    duration: "3-5 jours",
    active: true,
    popular: true,
  },
  {
    id: 4,
    name: "Débouchage canalisation",
    description: "Débouchage mécanique ou haute pression",
    priceType: "fixed",
    price: 120,
    duration: "1h",
    active: true,
    popular: false,
  },
  {
    id: 5,
    name: "Installation robinetterie",
    description: "Pose de robinets, mitigeurs, douchettes",
    priceType: "fixed",
    price: 80,
    duration: "1h",
    active: false,
    popular: false,
  },
];

export const ArtisanServices = () => {
  const [services, setServices] = useState(initialServices);
  const [isAdding, setIsAdding] = useState(false);

  const toggleActive = (id: number) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  const togglePopular = (id: number) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, popular: !s.popular } : s
    ));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <ArtisanSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Mes prestations" 
          subtitle="Définissez les services que vous proposez et vos tarifs"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                <p className="text-sm text-muted-foreground">Services actifs</p>
                <p className="text-2xl font-bold text-foreground">
                  {services.filter(s => s.active).length}
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                <p className="text-sm text-muted-foreground">Prix moyen</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(
                    services
                      .filter(s => s.price)
                      .reduce((acc, s) => acc + (s.price || 0), 0) / 
                    services.filter(s => s.price).length
                  )}€
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                <p className="text-sm text-muted-foreground">Services populaires</p>
                <p className="text-2xl font-bold text-accent">
                  {services.filter(s => s.popular).length}
                </p>
              </div>
            </div>

            {/* Add Service Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">Liste des prestations</h3>
              <Button variant="gold" onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4 mr-2" /> Ajouter une prestation
              </Button>
            </div>

            {/* Add Service Form */}
            {isAdding && (
              <div className="bg-card rounded-xl border border-accent/30 shadow-soft p-6 animate-fade-in">
                <h4 className="font-semibold text-foreground mb-4">Nouvelle prestation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom de la prestation</Label>
                    <Input placeholder="Ex: Dépannage plomberie" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type de tarification</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="fixed">Prix fixe</option>
                      <option value="hourly">Taux horaire</option>
                      <option value="quote">Sur devis</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prix (€)</Label>
                    <Input type="number" placeholder="60" />
                  </div>
                  <div className="space-y-2">
                    <Label>Durée estimée</Label>
                    <Input placeholder="Ex: 1-2h" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Décrivez votre prestation..." rows={3} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    Annuler
                  </Button>
                  <Button variant="gold" onClick={() => setIsAdding(false)}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Ajouter
                  </Button>
                </div>
              </div>
            )}

            {/* Services List */}
            <div className="space-y-4">
              {services.map((service) => (
                <div 
                  key={service.id}
                  className={`bg-card rounded-xl border shadow-soft p-6 transition-all ${
                    service.active 
                      ? "border-border hover:border-accent/30" 
                      : "border-border opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button className="mt-1 text-muted-foreground hover:text-foreground cursor-grab">
                      <GripVertical className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">{service.name}</h4>
                            {service.popular && (
                              <Badge className="bg-accent/20 text-accent border-0 text-xs">
                                Populaire
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {service.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={service.active}
                            onCheckedChange={() => toggleActive(service.id)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Euro className="w-4 h-4 text-accent" />
                          {service.priceType === "quote" ? (
                            <span className="text-foreground">Sur devis</span>
                          ) : service.priceType === "hourly" ? (
                            <span className="text-foreground">{service.price}€/h</span>
                          ) : (
                            <span className="text-foreground">{service.price}€</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration}</span>
                        </div>
                        <button 
                          onClick={() => togglePopular(service.id)}
                          className={`text-xs px-2 py-1 rounded-full transition-colors ${
                            service.popular 
                              ? "bg-accent/20 text-accent" 
                              : "bg-muted text-muted-foreground hover:bg-accent/10 hover:text-accent"
                          }`}
                        >
                          {service.popular ? "★ Mise en avant" : "☆ Mettre en avant"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
