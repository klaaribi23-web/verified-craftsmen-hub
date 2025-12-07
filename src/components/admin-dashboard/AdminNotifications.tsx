import { Bell, User, Briefcase, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: "artisan" | "client" | "mission";
  message: string;
  time: string;
  isNew: boolean;
}

const notifications: Notification[] = [
  { id: "1", type: "artisan", message: "Nouvel artisan inscrit : Jean Dupont (Plombier)", time: "Il y a 5 min", isNew: true },
  { id: "2", type: "mission", message: "Nouvelle mission postée : Rénovation salle de bain", time: "Il y a 15 min", isNew: true },
  { id: "3", type: "client", message: "Nouveau client inscrit : Marie Martin", time: "Il y a 30 min", isNew: true },
  { id: "4", type: "artisan", message: "Nouvel artisan inscrit : Pierre Bernard (Électricien)", time: "Il y a 1h", isNew: false },
  { id: "5", type: "mission", message: "Nouvelle mission postée : Installation cuisine", time: "Il y a 2h", isNew: false },
];

const getIcon = (type: string) => {
  switch (type) {
    case "artisan":
      return UserPlus;
    case "client":
      return User;
    case "mission":
      return Briefcase;
    default:
      return Bell;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case "artisan":
      return "bg-primary/10 text-primary";
    case "client":
      return "bg-green-500/10 text-green-500";
    case "mission":
      return "bg-yellow-500/10 text-yellow-500";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const AdminNotifications = () => {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <Badge variant="secondary">{notifications.filter(n => n.isNew).length} nouvelles</Badge>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.map((notification) => {
          const Icon = getIcon(notification.type);
          return (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                notification.isNew ? "bg-primary/5" : "hover:bg-muted"
              }`}
            >
              <div className={`p-2 rounded-full ${getColor(notification.type)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
              </div>
              {notification.isNew && (
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              )}
            </div>
          );
        })}
        <Button variant="outline" className="w-full mt-4">
          Voir toutes les notifications
        </Button>
      </CardContent>
    </Card>
  );
};
