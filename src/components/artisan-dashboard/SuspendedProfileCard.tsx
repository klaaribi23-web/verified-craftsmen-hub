import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertOctagon, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export const SuspendedProfileCard = () => {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-destructive" />
            Compte suspendu
          </CardTitle>
          <Badge variant="destructive">
            Suspendu
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive font-medium mb-2">
            Votre compte est actuellement suspendu.
          </p>
          <p className="text-sm text-muted-foreground">
            Votre profil n'est plus visible par les clients. Cette suspension peut être due à :
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Documents expirés ou invalides</li>
            <li>Non-respect des conditions d'utilisation</li>
            <li>Demande de suspension de votre part</li>
          </ul>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Pour réactiver votre compte, veuillez contacter notre équipe support.
          </p>
          <Link to="/contact">
            <Button variant="outline" size="sm" className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Contacter le support
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
