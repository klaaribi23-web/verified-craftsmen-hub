import { useState } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  MapPin,
  User,
  Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const events = [
  {
    id: 1,
    title: "Rénovation salle de bain",
    client: "Laurent Petit",
    address: "45 rue de la Paix, Paris 2e",
    date: "2024-12-09",
    startTime: "09:00",
    endTime: "17:00",
    type: "job",
  },
  {
    id: 2,
    title: "Dépannage fuite",
    client: "Marie Martin",
    address: "12 rue des Lilas, Paris 15e",
    date: "2024-12-10",
    startTime: "09:00",
    endTime: "11:00",
    type: "job",
  },
  {
    id: 3,
    title: "Installation robinetterie",
    client: "Claire Moreau",
    address: "12 avenue Victor Hugo, Paris 16e",
    date: "2024-12-12",
    startTime: "14:00",
    endTime: "16:00",
    type: "job",
  },
];

const availabilitySlots = [
  { day: "Lundi", slots: ["09:00-12:00", "14:00-18:00"], active: true },
  { day: "Mardi", slots: ["09:00-12:00", "14:00-18:00"], active: true },
  { day: "Mercredi", slots: ["09:00-12:00", "14:00-18:00"], active: true },
  { day: "Jeudi", slots: ["09:00-12:00", "14:00-18:00"], active: true },
  { day: "Vendredi", slots: ["09:00-12:00", "14:00-17:00"], active: true },
  { day: "Samedi", slots: ["09:00-12:00"], active: false },
  { day: "Dimanche", slots: [], active: false },
];

export const ArtisanPlanning = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [availability, setAvailability] = useState(availabilitySlots);

  const toggleDayAvailability = (dayIndex: number) => {
    const updated = [...availability];
    updated[dayIndex].active = !updated[dayIndex].active;
    setAvailability(updated);
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

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return events.filter(e => e.date === dateStr);
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
                    const dayEvents = getEventsForDate(day.date);
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
                          <>
                            <span className={cn(
                              "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm",
                              isToday && "bg-accent text-accent-foreground font-bold"
                            )}>
                              {day.date.getDate()}
                            </span>
                            <div className="mt-1 space-y-1">
                              {dayEvents.slice(0, 2).map((event) => (
                                <div 
                                  key={event.id}
                                  className="text-xs p-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20 transition-colors"
                                >
                                  {event.startTime} {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{dayEvents.length - 2} autres
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Upcoming Events */}
                <div className="bg-card rounded-xl border border-border shadow-soft p-4">
                  <h3 className="font-semibold text-foreground mb-4">Prochains rendez-vous</h3>
                  <div className="space-y-3">
                    {events.slice(0, 3).map((event) => (
                      <div 
                        key={event.id}
                        className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-foreground text-sm">{event.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.startTime}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {event.client}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.address}
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {new Date(event.date).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    <Clock className="w-4 h-4 mr-2" /> Modifier les horaires
                  </Button>
                </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
