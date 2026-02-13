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

const LeadsParticuliersTab = ({ data: rawData }: { data: any[] }) => {
  // Filter out empty/incomplete rows that only show dashes
  const data = rawData.filter((lead: any) => 
    (lead.nom && lead.nom !== '' && lead.nom !== 'ANONYMISÉ') || 
    (lead.telephone && lead.telephone !== '') || 
    (lead.ville && lead.ville !== '') || 
    (lead.type_projet && lead.type_projet !== '')
  );

  return (
  <Card>
    <CardHeader><CardTitle className="text-lg">Particuliers avec projet</CardTitle></CardHeader>
    <CardContent className="overflow-x-auto">
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Aucun lead particulier</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Type de projet</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((lead: any) => (
              <TableRow key={lead.id}>
                <TableCell className="text-xs whitespace-nowrap">{formatDate(lead.created_at)}</TableCell>
                <TableCell className="font-medium">{[lead.prenom, lead.nom].filter(Boolean).join(" ") || "—"}</TableCell>
                <TableCell>{lead.telephone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telephone}</span> : "—"}</TableCell>
                <TableCell>{lead.ville ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.ville}</span> : "—"}</TableCell>
                <TableCell>{lead.type_projet || "—"}</TableCell>
                <TableCell>{lead.budget_estime || "—"}</TableCell>
                <TableCell>{statusBadge(lead.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
  );
};

export default LeadsParticuliersTab;
