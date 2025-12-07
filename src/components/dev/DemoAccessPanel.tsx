import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Wrench,
  User,
  ChevronUp,
  ChevronDown,
  Eye
} from "lucide-react";

export const DemoAccessPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const dashboards = [
    {
      role: "Admin",
      icon: Shield,
      path: "/admin/dashboard",
      color: "bg-red-500",
      description: "Gérer artisans, clients, approbations"
    },
    {
      role: "Artisan",
      icon: Wrench,
      path: "/artisan/dashboard",
      color: "bg-amber-500",
      description: "Profil, demandes, messagerie"
    },
    {
      role: "Client",
      icon: User,
      path: "/client/dashboard",
      color: "bg-blue-500",
      description: "Missions, favoris, messagerie"
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`shadow-2xl border-2 border-primary/20 transition-all ${isExpanded ? 'w-72' : 'w-auto'}`}>
        <CardHeader 
          className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-semibold">Mode Démo</CardTitle>
              <Badge variant="secondary" className="text-xs">DEV</Badge>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="p-3 pt-0 space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              Accédez aux dashboards sans connexion
            </p>
            {dashboards.map((dashboard) => (
              <Link key={dashboard.role} to={dashboard.path}>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                >
                  <div className={`h-8 w-8 rounded-lg ${dashboard.color} flex items-center justify-center`}>
                    <dashboard.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{dashboard.role}</p>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.description}
                    </p>
                  </div>
                </Button>
              </Link>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
