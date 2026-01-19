import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const DeleteDemoMissions = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  // Count demo missions
  const { data: demoCount, isLoading } = useQuery({
    queryKey: ["demo-missions-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("missions")
        .select("*", { count: "exact", head: true })
        .not("fake_client_id", "is", null);

      if (error) throw error;
      return count || 0;
    },
  });

  const handleDeleteDemoMissions = async () => {
    setIsDeleting(true);
    try {
      // First, get all demo mission IDs
      const { data: demoMissions, error: fetchError } = await supabase
        .from("missions")
        .select("id")
        .not("fake_client_id", "is", null);

      if (fetchError) throw fetchError;

      if (!demoMissions || demoMissions.length === 0) {
        toast.info("Aucune mission de démonstration à supprimer");
        return;
      }

      const missionIds = demoMissions.map((m) => m.id);

      // Delete applications on these missions
      const { error: appError } = await supabase
        .from("mission_applications")
        .delete()
        .in("mission_id", missionIds);

      if (appError) throw appError;

      // Delete the demo missions
      const { error: missionsError } = await supabase
        .from("missions")
        .delete()
        .not("fake_client_id", "is", null);

      if (missionsError) throw missionsError;

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["demo-missions-count"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["missions"] });
      await queryClient.invalidateQueries({ queryKey: ["published-missions"] });

      toast.success(`${missionIds.length} missions de démonstration supprimées avec succès`);
    } catch (error) {
      console.error("Error deleting demo missions:", error);
      toast.error("Erreur lors de la suppression des missions de démonstration");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          Missions de démonstration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              "Chargement..."
            ) : (
              <>
                <span className="font-semibold text-foreground">{demoCount}</span> missions
                de démonstration dans la base de données.
              </>
            )}
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={isDeleting || isLoading || demoCount === 0}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer toutes les missions démo
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirmer la suppression
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Vous êtes sur le point de supprimer <strong>{demoCount} missions de
                  démonstration</strong> ainsi que toutes les candidatures associées.
                  <br /><br />
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteDemoMissions}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer définitivement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
