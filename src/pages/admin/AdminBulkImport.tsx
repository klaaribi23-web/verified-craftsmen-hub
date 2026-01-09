import { useState, useCallback } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useAdminData";
import { geocodeCity } from "@/lib/communesApi";
import {
  Upload,
  FileJson,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Trash2,
  FileSpreadsheet,
  MapPin,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ParsedArtisan {
  businessName: string;
  description: string;
  email: string;
  phone: string;
  city: string;
  postalCode: string;
  address: string;
  siret: string;
  services: string[];
  rating: number;
  reviewsCount: number;
  linkedinUrl: string;
  facebookUrl: string;
  websiteUrl: string;
  googleId: string;
  googleMapsUrl: string;
  googleRating: number;
  googleReviewCount: number;
  portfolioImages: string[];
}

interface ColumnConfig {
  key: keyof ParsedArtisan;
  label: string;
  enabled: boolean;
  required: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "businessName", label: "Nom de l'entreprise", enabled: true, required: true },
  { key: "description", label: "Description", enabled: true, required: false },
  { key: "email", label: "Email", enabled: true, required: false },
  { key: "phone", label: "Téléphone", enabled: true, required: false },
  { key: "city", label: "Ville", enabled: true, required: true },
  { key: "postalCode", label: "Code postal", enabled: true, required: false },
  { key: "address", label: "Adresse", enabled: true, required: false },
  { key: "siret", label: "SIRET", enabled: true, required: false },
  { key: "services", label: "Services", enabled: true, required: false },
  { key: "linkedinUrl", label: "LinkedIn", enabled: true, required: false },
  { key: "facebookUrl", label: "Facebook", enabled: true, required: false },
  { key: "websiteUrl", label: "Site Web", enabled: true, required: false },
  { key: "googleId", label: "Google ID", enabled: true, required: false },
  { key: "googleMapsUrl", label: "Lien Google Maps", enabled: true, required: false },
  { key: "googleRating", label: "Note Google", enabled: true, required: false },
  { key: "googleReviewCount", label: "Avis Google", enabled: true, required: false },
  { key: "portfolioImages", label: "Images Portfolio", enabled: true, required: false },
];

// Map common service names to category names
const SERVICE_TO_CATEGORY_MAP: Record<string, string> = {
  plomberie: "Plombier",
  plombier: "Plombier",
  chauffage: "Chauffagiste",
  chauffagiste: "Chauffagiste",
  électricité: "Électricien",
  electricite: "Électricien",
  électricien: "Électricien",
  electricien: "Électricien",
  peinture: "Peintre",
  peintre: "Peintre",
  maçonnerie: "Maçon",
  maconnerie: "Maçon",
  maçon: "Maçon",
  macon: "Maçon",
  carrelage: "Carreleur",
  carreleur: "Carreleur",
  menuiserie: "Menuisier",
  menuisier: "Menuisier",
  couverture: "Couvreur",
  couvreur: "Couvreur",
  toiture: "Couvreur",
  serrurerie: "Serrurier",
  serrurier: "Serrurier",
  climatisation: "Climaticien",
  climaticien: "Climaticien",
  isolation: "Isolation thermique",
  rénovation: "Rénovation complète",
  renovation: "Rénovation complète",
};

const AdminBulkImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"json" | "csv" | null>(null);
  const [parsedData, setParsedData] = useState<ParsedArtisan[]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: number;
    errorDetails: string[];
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: categories } = useCategories();

  const parseJsonFile = (jsonData: any[]): ParsedArtisan[] => {
    return jsonData.map((item) => ({
      businessName: item.businessName || item.business_name || item.name || "",
      description: item.about || item.description || "",
      email: item.contact?.email || item.email || "",
      phone: item.contact?.telephone || item.contact?.phone || item.phone || "",
      city: item.contact?.address?.city || item.city || "",
      postalCode: item.contact?.address?.postalCode || item.postal_code || item.postalCode || "",
      address: item.contact?.address?.street || item.address || "",
      siret: item.contact?.vatID || item.siret || "",
      services: Array.isArray(item.services) ? item.services : [],
      // Platform ratings (not Google)
      rating: 0,
      reviewsCount: 0,
      linkedinUrl: item.linkedin_url || item.linkedinUrl || item.contact?.linkedin || "",
      facebookUrl: item.facebook_url || item.facebookUrl || item.contact?.facebook || "",
      websiteUrl: item.website_url || item.websiteUrl || item.contact?.website || item.website || "",
      // Google data
      googleId: item.google_id || item.googleId || "",
      googleMapsUrl: item.link || item.google_maps_url || item.googleMapsUrl || "",
      googleRating: item.rating || 0,
      googleReviewCount: item.review_count || item.reviews_count || item.reviewsCount || 0,
      portfolioImages: item.portfolio_images || item.portfolioImages || [],
    }));
  };

  const parseCsvFile = (csvContent: string): ParsedArtisan[] => {
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Parse header row
    const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase().replace(/"/g, ""));

    // Map CSV headers to our fields
    const headerMap: Record<string, keyof ParsedArtisan> = {
      nom: "businessName",
      "nom de l'entreprise": "businessName",
      business_name: "businessName",
      businessname: "businessName",
      entreprise: "businessName",
      "raison sociale": "businessName",
      description: "description",
      about: "description",
      email: "email",
      mail: "email",
      telephone: "phone",
      téléphone: "phone",
      phone: "phone",
      tel: "phone",
      ville: "city",
      city: "city",
      "code postal": "postalCode",
      code_postal: "postalCode",
      postal_code: "postalCode",
      cp: "postalCode",
      adresse: "address",
      address: "address",
      siret: "siret",
      siren: "siret",
      services: "services",
      prestations: "services",
      categorie: "services",
      catégorie: "services",
      linkedin: "linkedinUrl",
      linkedin_url: "linkedinUrl",
      facebook: "facebookUrl",
      facebook_url: "facebookUrl",
      website: "websiteUrl",
      website_url: "websiteUrl",
      "site web": "websiteUrl",
      site: "websiteUrl",
      google_id: "googleId",
      googleid: "googleId",
      "google id": "googleId",
      link: "googleMapsUrl",
      google_maps_url: "googleMapsUrl",
      "google maps": "googleMapsUrl",
      "lien google": "googleMapsUrl",
      rating: "googleRating",
      note: "googleRating",
      "note google": "googleRating",
      google_rating: "googleRating",
      review_count: "googleReviewCount",
      reviews_count: "googleReviewCount",
      avis: "googleReviewCount",
      "avis google": "googleReviewCount",
      google_review_count: "googleReviewCount",
    };

    const columnIndexes: Partial<Record<keyof ParsedArtisan, number>> = {};
    headers.forEach((header, index) => {
      const mappedField = headerMap[header];
      if (mappedField) {
        columnIndexes[mappedField] = index;
      }
    });

    // Parse data rows
    return lines
      .slice(1)
      .map((line) => {
        // Handle quoted values with commas inside
        const values: string[] = [];
        let current = "";
        let inQuotes = false;

        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if ((char === "," || char === ";") && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const getValue = (field: keyof ParsedArtisan): string => {
          const index = columnIndexes[field];
          return index !== undefined ? values[index]?.replace(/"/g, "") || "" : "";
        };

        const servicesValue = getValue("services");
        const services = servicesValue
          ? servicesValue
              .split(/[|,;]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        return {
          businessName: getValue("businessName"),
          description: getValue("description"),
          email: getValue("email"),
          phone: getValue("phone"),
          city: getValue("city"),
          postalCode: getValue("postalCode"),
          address: getValue("address"),
          siret: getValue("siret"),
          services,
          rating: 0,
          reviewsCount: 0,
          linkedinUrl: getValue("linkedinUrl"),
          facebookUrl: getValue("facebookUrl"),
          websiteUrl: getValue("websiteUrl"),
          googleId: getValue("googleId"),
          googleMapsUrl: getValue("googleMapsUrl"),
          googleRating: parseFloat(getValue("googleRating")) || 0,
          googleReviewCount: parseInt(getValue("googleReviewCount")) || 0,
          portfolioImages: [], // CSV support for arrays is complex, skipping for now or handle string split if needed
        };
      })
      .filter((a) => a.businessName || a.city);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    const isJson = selectedFile.name.endsWith(".json");
    const isCsv = selectedFile.name.endsWith(".csv");

    if (!isJson && !isCsv) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier JSON ou CSV",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "Le fichier ne doit pas dépasser 10 MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setFileType(isJson ? "json" : "csv");
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsed: ParsedArtisan[];

        if (isJson) {
          const json = JSON.parse(content);
          const data = Array.isArray(json) ? json : [json];
          parsed = parseJsonFile(data);
        } else {
          parsed = parseCsvFile(content);
        }

        setParsedData(parsed);
        setColumns(DEFAULT_COLUMNS);

        toast({
          title: "Fichier analysé",
          description: `${parsed.length} artisans détectés`,
        });
      } catch (error) {
        toast({
          title: "Erreur de parsing",
          description: `Le fichier ${isJson ? "JSON" : "CSV"} est invalide`,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const toggleColumn = (key: keyof ParsedArtisan) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key && !col.required ? { ...col, enabled: !col.enabled } : col)),
    );
  };

  // Find ALL category IDs from services (first = principal, others = secondary skills)
  const findAllCategoryIds = (services: string[]): string[] => {
    if (!categories || services.length === 0) return [];

    const foundIds: string[] = [];

    for (const service of services) {
      const normalizedService = service.toLowerCase().trim();
      const mappedCategory = SERVICE_TO_CATEGORY_MAP[normalizedService];

      if (mappedCategory) {
        const category = categories.find((c) => c.name.toLowerCase() === mappedCategory.toLowerCase());
        if (category && !foundIds.includes(category.id)) {
          foundIds.push(category.id);
        }
      } else {
        // Try direct match
        const directMatch = categories.find(
          (c) => c.name.toLowerCase().includes(normalizedService) || normalizedService.includes(c.name.toLowerCase()),
        );
        if (directMatch && !foundIds.includes(directMatch.id)) {
          foundIds.push(directMatch.id);
        }
      }
    }

    return foundIds;
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    const enabledColumns = columns.filter((c) => c.enabled).map((c) => c.key);
    const batchSize = 500;
    const totalBatches = Math.ceil(parsedData.length / batchSize);
    let successCount = 0;
    let errorCount = 0;
    const errorDetails: string[] = [];

    const processPortfolioImages = async (artisanId: string, imageUrls: string[]): Promise<string[]> => {
      const uploadedUrls: string[] = [];

      for (const url of imageUrls) {
        try {
          // 1. Fetch the image from Google (client-side)
          // Note: This relies on the image host allowing CORS.
          // lh3.googleusercontent.com usually allows it.
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

          const blob = await response.blob();
          const fileExt = blob.type.split("/")[1] || "jpg";
          const fileName = `${artisanId}/imported/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          // 2. Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage.from("artisan-portfolios").upload(fileName, blob, {
            contentType: blob.type,
            upsert: true,
          });

          if (uploadError) throw uploadError;

          // 3. Get Public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("artisan-portfolios").getPublicUrl(fileName);

          uploadedUrls.push(publicUrl);
        } catch (err) {
          console.error(`Error processing image ${url} for artisan ${artisanId}:`, err);
          // Continue with other images even if one fails
        }
      }
      return uploadedUrls;
    };

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, parsedData.length);
      const batch = parsedData.slice(start, end);

      for (const artisan of batch) {
        try {
          // Build artisan data based on enabled columns
          const artisanData: any = {
            business_name: artisan.businessName || "À compléter",
            city: artisan.city || "À compléter",
            status: "prospect" as const,
            is_verified: false,
          };

          if (enabledColumns.includes("description")) {
            artisanData.description = artisan.description;
          }
          if (enabledColumns.includes("email")) {
            artisanData.email = artisan.email;
          }
          if (enabledColumns.includes("phone")) {
            artisanData.phone = artisan.phone;
          }
          if (enabledColumns.includes("postalCode")) {
            artisanData.postal_code = artisan.postalCode;
          }
          if (enabledColumns.includes("address")) {
            artisanData.address = artisan.address;
          }
          if (enabledColumns.includes("siret")) {
            artisanData.siret = artisan.siret;
          }
          if (enabledColumns.includes("linkedinUrl") && artisan.linkedinUrl) {
            artisanData.linkedin_url = artisan.linkedinUrl;
          }
          if (enabledColumns.includes("facebookUrl") && artisan.facebookUrl) {
            artisanData.facebook_url = artisan.facebookUrl;
          }
          if (enabledColumns.includes("websiteUrl") && artisan.websiteUrl) {
            artisanData.website_url = artisan.websiteUrl;
          }
          // Google data
          if (enabledColumns.includes("googleId") && artisan.googleId) {
            artisanData.google_id = artisan.googleId;
          }
          if (enabledColumns.includes("googleMapsUrl") && artisan.googleMapsUrl) {
            artisanData.google_maps_url = artisan.googleMapsUrl;
          }
          if (enabledColumns.includes("googleRating") && artisan.googleRating > 0) {
            artisanData.google_rating = artisan.googleRating;
          }
          if (enabledColumns.includes("googleReviewCount") && artisan.googleReviewCount > 0) {
            artisanData.google_review_count = artisan.googleReviewCount;
          }
          if (enabledColumns.includes("portfolioImages") && artisan.portfolioImages.length > 0) {
            artisanData.portfolio_images = artisan.portfolioImages;
          }

          // Horaires par défaut : 8h-18h du lundi au samedi
          artisanData.working_hours = {
            lundi: { start: "08:00", end: "18:00", enabled: true },
            mardi: { start: "08:00", end: "18:00", enabled: true },
            mercredi: { start: "08:00", end: "18:00", enabled: true },
            jeudi: { start: "08:00", end: "18:00", enabled: true },
            vendredi: { start: "08:00", end: "18:00", enabled: true },
            samedi: { start: "08:00", end: "18:00", enabled: true },
            dimanche: { start: "08:00", end: "18:00", enabled: false },
          };

          // Find ALL categories from services (first = principal, rest = secondary skills)
          const categoryIds = findAllCategoryIds(artisan.services);
          if (categoryIds.length > 0) {
            artisanData.category_id = categoryIds[0]; // First category = principal
          }

          // Géocodage automatique de la ville
          if (artisan.city && artisan.city !== "À compléter") {
            try {
              const geoResult = await geocodeCity(artisan.city, artisan.postalCode);
              if (geoResult) {
                artisanData.latitude = geoResult.lat;
                artisanData.longitude = geoResult.lng;
                artisanData.intervention_radius = 50; // 50 km par défaut
              }
            } catch (geoError) {
              console.warn(`Géocodage échoué pour ${artisan.city}:`, geoError);
              // Continuer sans coordonnées - pas bloquant
            }
          }

          // Insert artisan
          const { data: insertedArtisan, error: artisanError } = await supabase
            .from("artisans")
            .insert(artisanData)
            .select()
            .single();

          if (artisanError) throw artisanError;

          // Insert ALL categories into artisan_categories (primary + secondary skills)
          if (categoryIds.length > 0 && insertedArtisan) {
            const categoryInserts = categoryIds.map(catId => ({
              artisan_id: insertedArtisan.id,
              category_id: catId,
            }));
            await supabase.from("artisan_categories").insert(categoryInserts);
          }

          // NOTE: We no longer insert categories as services
          // Services (prestations) will be filled by the artisan themselves when they claim their profile

          // Process Portfolio Images if enabled and present
          if (enabledColumns.includes("portfolioImages") && artisan.portfolioImages.length > 0 && insertedArtisan) {
            // Note: We do this AFTER initial insert to have the artisan_id
            try {
              const uploadedUrls = await processPortfolioImages(insertedArtisan.id, artisan.portfolioImages);

              if (uploadedUrls.length > 0) {
                await supabase.from("artisans").update({ portfolio_images: uploadedUrls }).eq("id", insertedArtisan.id);
              }
            } catch (imgError) {
              console.error("Error processing portfolio images for", artisan.businessName, imgError);
              // Don't fail the entire artisan import just because images failed, but maybe log it?
              // errorDetails.push(`${artisan.businessName} (Images Warning): ${imgError.message}`);
            }
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errorDetails.push(`${artisan.businessName}: ${error.message}`);
        }
      }

      // Update progress
      const progress = Math.round(((batchIndex + 1) / totalBatches) * 100);
      setImportProgress(progress);
    }

    setIsImporting(false);
    setImportResults({ success: successCount, errors: errorCount, errorDetails });

    if (errorCount === 0) {
      toast({
        title: "✅ Import réussi",
        description: `${successCount} artisans VITRINE créés`,
      });
    } else {
      toast({
        title: "⚠️ Import terminé avec erreurs",
        description: `${successCount} importés, ${errorCount} erreurs`,
        variant: "destructive",
      });
    }
  };

  const handleClear = () => {
    setFile(null);
    setFileType(null);
    setParsedData([]);
    setImportResults(null);
    setImportProgress(0);
  };

  const downloadErrorReport = () => {
    if (!importResults?.errorDetails.length) return;

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Artisan,Erreur\n" +
      importResults.errorDetails.map((e) => `"${e.split(":")[0]}","${e.split(":").slice(1).join(":")}"`).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "erreurs_import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Import massif d'artisans</h1>
            <p className="text-muted-foreground mt-1">Importez des artisans VITRINE depuis un fichier JSON ou CSV</p>
          </div>

          {/* Upload Zone */}
          {!file && (
            <Card className="mb-6">
              <CardContent className="p-8">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Glissez-déposez votre fichier JSON ou CSV</h3>
                  <p className="text-muted-foreground mb-4">ou cliquez pour sélectionner un fichier</p>
                  <p className="text-sm text-muted-foreground mb-4">Maximum 10 MB • Formats JSON et CSV supportés</p>
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild>
                      <span>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Sélectionner un fichier
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-6">
                    <strong>CSV :</strong> Colonnes attendues : nom, email, telephone, ville, code_postal, adresse,
                    siret, services
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Info & Clear */}
          {file && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {fileType === "json" ? (
                      <FileJson className="h-8 w-8 text-primary" />
                    ) : (
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB • {parsedData.length} artisans détectés • Format{" "}
                        {fileType?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClear}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Effacer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Column Selection */}
          {parsedData.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Colonnes à importer</CardTitle>
                <CardDescription>Sélectionnez les colonnes que vous souhaitez importer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {columns.map((col) => (
                    <div key={col.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={col.key}
                        checked={col.enabled}
                        disabled={col.required}
                        onCheckedChange={() => toggleColumn(col.key)}
                      />
                      <label
                        htmlFor={col.key}
                        className={`text-sm cursor-pointer ${col.required ? "font-medium" : ""}`}
                      >
                        {col.label}
                        {col.required && <span className="text-destructive ml-1">*</span>}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">* Colonnes obligatoires</p>
              </CardContent>
            </Card>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Prévisualisation</CardTitle>
                <CardDescription>10 premiers artisans sur {parsedData.length}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns
                          .filter((c) => c.enabled)
                          .map((col) => (
                            <TableHead key={col.key}>{col.label}</TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((artisan, index) => (
                        <TableRow key={index}>
                          {columns
                            .filter((c) => c.enabled)
                            .map((col) => (
                              <TableCell key={col.key} className="max-w-[200px] truncate">
                                {col.key === "services"
                                  ? artisan.services.slice(0, 2).join(", ") + (artisan.services.length > 2 ? "..." : "")
                                  : col.key === "portfolioImages"
                                    ? `${artisan.portfolioImages.length} photos`
                                    : String(artisan[col.key] || "-")}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Bar */}
          {isImporting && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="font-medium">Import en cours...</span>
                  <span className="text-muted-foreground">{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">Traitement par lots de 500 artisans...</p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {importResults && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-500">{importResults.success} importés</span>
                  </div>
                  {importResults.errors > 0 && (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="font-medium text-destructive">{importResults.errors} erreurs</span>
                    </div>
                  )}
                </div>

                {importResults.errors > 0 && (
                  <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le rapport d'erreurs
                  </Button>
                )}

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <AlertTriangle className="h-4 w-4 inline mr-2 text-yellow-500" />
                    Les artisans importés sont en statut <Badge variant="secondary">VITRINE</Badge> et apparaîtront dans
                    <strong> Approbations → Vitrines</strong> pour être revendiqués.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Button */}
          {parsedData.length > 0 && !isImporting && (
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={handleClear}>
                Annuler
              </Button>
              <Button onClick={handleImport} disabled={parsedData.length === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Publier {parsedData.length} artisans VITRINE
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminBulkImport;
