import { useState, useEffect } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  Calendar as CalendarIcon,
  Save,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const defaultAvailabilitySlots = [
  { day: "Lundi", slots: ["09:00-12:00", "14:00-18:00"], active: true },
  { day: "Mardi", slots: ["09:00-12:00", "14:00-18:00"], active: true },
  { day: "Mercredi", slots: ["09:00-12:00", "14:00-18:00"], active: true },
  { day: "Jeudi", slots: ["09:00-12:00", "14:00-18:00"], active: true },
  { day: "Vendredi", slots: ["09:00-12:00", "14:00-17:00"], active: true },
  { day: "Samedi", slots: ["09:00-12:00"], active: false },
  { day: "Dimanche", slots: [], active: false },
];

interface AvailabilitySlot {
  day: string;
  slots: string[];
  active: boolean;
}

export const ArtisanPlanning = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(defaultAvailabilitySlots);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editedAvailability, setEditedAvailability] = useState<AvailabilitySlot[]>(defaultAvailabilitySlots);

  // Fetch artisan data
  const { data: artisan } = useQuery({
    queryKey: ["artisan-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("artisans")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Load availability from artisan data
  useEffect(() => {
    if (artisan?.availability && Array.isArray(artisan.availability)) {
      const savedAvailability = artisan.availability as unknown as AvailabilitySlot[];
      if (savedAvailability.length > 0) {
        setAvailability(savedAvailability);
        setEditedAvailability(savedAvailability);
      }
    }
  }, [artisan]);

  // Mutation to save availability
  const saveAvailabilityMutation = useMutation({
    mutationFn: async (newAvailability: AvailabilitySlot[]) => {
      if (!artisan?.id) throw new Error("Artisan non trouvé");
      const { error } = await supabase
        .from("artisans")
        .update({ availability: newAvailability as unknown as Record<string, unknown> })
        .eq("id", artisan.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artisan-profile"] });
      toast.success("Horaires mis à jour avec succès");
      setIsEditingHours(false);
      setAvailability(editedAvailability);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour des horaires");
    }
  });

  const toggleDayAvailability = (dayIndex: number) => {
    const updated = [...availability];
    updated[dayIndex].active = !updated[dayIndex].active;
    setAvailability(updated);
  };

  const toggleEditedDayAvailability = (dayIndex: number) => {
    const updated = [...editedAvailability];
    updated[dayIndex].active = !updated[dayIndex].active;
    setEditedAvailability(updated);
  };

  const updateEditedSlot = (dayIndex: number, slotIndex: number, value: string) => {
    const updated = [...editedAvailability];
    updated[dayIndex].slots[slotIndex] = value;
    setEditedAvailability(updated);
  };

  const addSlot = (dayIndex: number) => {
    const updated = [...editedAvailability];
    updated[dayIndex].slots.push("09:00-18:00");
    setEditedAvailability(updated);
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const updated = [...editedAvailability];
    updated[dayIndex].slots.splice(slotIndex, 1);
    setEditedAvailability(updated);
  };

  const handleSaveAvailability = () => {
    saveAvailabilityMutation.mutate(editedAvailability);
  };

  const openEditModal = () => {
    setEditedAvailability([...availability]);
    setIsEditingHours(true);
  };

  // Generate calendar days for the current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add padding for days before the first day
    const startPadding = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }
    
    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ 
        date: new Date(year, month, i), 
        isCurrentMonth: true 
      });
    }
    
    return days;
  };

  const monthDays = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ArtisanSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Planning" 
          subtitle="Gérez votre calendrier et vos disponibilités"
        />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Calendar Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-xl font-semibold text-foreground capitalize min-w-40 text-center">
                  {monthName}
                </h2>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={view === "week" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setView("week")}
                >
                  Semaine
                </Button>
                <Button 
                  variant={view === "month" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setView("month")}
                >
                  Mois
                </Button>
                <Button variant="gold" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-border">
                  {daysOfWeek.map((day) => (
                    <div 
                      key={day} 
                      className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/30"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                  {monthDays.map((day, index) => {
                    const isToday = day.date?.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-24 p-2 border-b border-r border-border last:border-r-0 [&:nth-child(7n)]:border-r-0",
                          !day.isCurrentMonth && "bg-muted/20",
                          isToday && "bg-accent/5"
                        )}
                      >
                        {day.date && (
                          <span className={cn(
                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm",
                            isToday && "bg-accent text-accent-foreground font-bold"
                          )}>
                            {day.date.getDate()}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Upcoming Events - Empty State */}
                <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                  <h3 className="font-semibold text-foreground mb-4">Prochains rendez-vous</h3>
                  <div className="py-8 text-center">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Aucun rendez-vous prévu</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Vos rendez-vous apparaîtront ici
                    </p>
                  </div>
                </div>

                {/* Availability Settings */}
                <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                  <h3 className="font-semibold text-foreground mb-4">Disponibilités</h3>
                  <div className="space-y-3">
                    {availability.map((day, index) => (
                      <div 
                        key={day.day}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Switch 
                            checked={day.active}
                            onCheckedChange={() => toggleDayAvailability(index)}
                          />
                          <span className={cn(
                            "text-sm",
                            day.active ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {day.day}
                          </span>
                        </div>
                        {day.active && day.slots.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {day.slots.join(", ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    size="sm"
                    onClick={openEditModal}
                  >
                    <Clock className="w-4 h-4 mr-2" /> Modifier les horaires
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    {/* Edit Hours Modal */}
    <Dialog open={isEditingHours} onOpenChange={setIsEditingHours}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les horaires de disponibilité</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {editedAvailability.map((day, dayIndex) => (
            <div key={day.day} className="space-y-2 p-3 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={day.active}
                    onCheckedChange={() => toggleEditedDayAvailability(dayIndex)}
                  />
                  <Label className={cn(
                    "font-medium",
                    day.active ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {day.day}
                  </Label>
                </div>
                {day.active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSlot(dayIndex)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {day.active && (
                <div className="pl-10 space-y-2">
                  {day.slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-2">
                      <Input
                        value={slot}
                        onChange={(e) => updateEditedSlot(dayIndex, slotIndex, e.target.value)}
                        placeholder="09:00-18:00"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeSlot(dayIndex, slotIndex)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {day.slots.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucun créneau défini</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditingHours(false)}>
            Annuler
          </Button>
          <Button 
            variant="gold" 
            onClick={handleSaveAvailability}
            disabled={saveAvailabilityMutation.isPending}
          >
            {saveAvailabilityMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
