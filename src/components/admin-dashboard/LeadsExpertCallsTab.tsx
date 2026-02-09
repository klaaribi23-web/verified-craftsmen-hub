import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    nouveau: "bg-blue-500/20 text-blue-400",
    contacte: "bg-amber-500/20 text-amber-400",
    converti: "bg-green-500/20 text-green-400",
    perdu: "bg-red-500/20 text-red-400",
  };
  return <Badge className={map[status] || "bg-muted text-muted-foreground"}>{status}</Badge>;
};

const formatDate = (d: string) => {
  try { return format(new Date(d), "dd MMM yyyy HH:mm", { locale: fr }); } catch { return d; }
};

const LeadsExpertCallsTab = ({ data }: { data: any[] }) => (
  <Card>
    <CardHeader><CardTitle className="text-lg">Demandes Économies d'Énergie & Aides</CardTitle></CardHeader>
    <CardContent className="overflow-x-auto">
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Aucune demande d'appel expert</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((call: any) => (
              <TableRow key={call.id}>
                <TableCell className="text-xs whitespace-nowrap">{formatDate(call.created_at)}</TableCell>
                <TableCell className="font-medium">{[call.prenom, call.nom].filter(Boolean).join(" ") || "—"}</TableCell>
                <TableCell>{call.telephone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{call.telephone}</span> : "—"}</TableCell>
                <TableCell className="text-xs">{call.email || "—"}</TableCell>
                <TableCell>{call.ville ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{call.ville}</span> : "—"}</TableCell>
                <TableCell><Badge variant="outline">{call.type_demande || "énergie"}</Badge></TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">{call.description || "—"}</TableCell>
                <TableCell>{statusBadge(call.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export default LeadsExpertCallsTab;
