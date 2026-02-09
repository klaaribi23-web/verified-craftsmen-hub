import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const formatDate = (d: string) => {
  try { return format(new Date(d), "dd MMM yyyy HH:mm", { locale: fr }); } catch { return d; }
};

const LeadsPendingArtisansTab = ({ data }: { data: any[] }) => (
  <Card>
    <CardHeader><CardTitle className="text-lg">Artisans en attente de validation</CardTitle></CardHeader>
    <CardContent className="overflow-x-auto">
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Aucun artisan en attente</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Métier</TableHead>
              <TableHead>SIRET</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((artisan: any) => (
              <TableRow key={artisan.id}>
                <TableCell className="text-xs whitespace-nowrap">{formatDate(artisan.created_at)}</TableCell>
                <TableCell className="font-medium">{artisan.business_name}</TableCell>
                <TableCell>{artisan.metier}</TableCell>
                <TableCell className="text-xs font-mono">{artisan.siret}</TableCell>
                <TableCell>{artisan.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{artisan.phone}</span> : "—"}</TableCell>
                <TableCell>{artisan.city ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{artisan.city}</span> : "—"}</TableCell>
                <TableCell><Badge className="bg-amber-500/20 text-amber-400">En attente</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export default LeadsPendingArtisansTab;
