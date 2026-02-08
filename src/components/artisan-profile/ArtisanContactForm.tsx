import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FrenchPhoneInput, validateFrenchPhone } from "@/components/ui/french-phone-input";
import { Shield, Send, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const requestSchema = z.object({
  clientName: z.string().trim().min(2, "Nom requis").max(100, "Nom trop long"),
  clientPhone: z.string().trim().refine(
    (val) => validateFrenchPhone(val),
    { message: "Num\u00e9ro fran\u00e7ais invalide (10 chiffres)" }
  ),
  clientCity: z.string().trim().min(2, "Ville requise").max(100, "Ville trop longue"),
  projectDescription: z.string().trim().min(10, "D\u00e9crivez bri\u00e8vement votre projet (min. 10 caract\u00e8res)").max(500, "Description trop longue (max. 500 caract\u00e8res)"),
});

interface ArtisanContactFormProps {
  artisanId: string;
  artisanName: string;
  artisanEmail: string | null;
  artisanCity: string;
  isAudited: boolean;
}

const ArtisanContactForm = ({
  artisanId,
  artisanName,
  artisanEmail,
  artisanCity,
  isAudited,
}: ArtisanContactFormProps) => {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = requestSchema.safeParse({
      clientName,
      clientPhone,
      clientCity,
      projectDescription,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to database
      const { error: insertError } = await supabase
        .from("project_requests")
        .insert({
          artisan_id: artisanId,
          client_name: clientName.trim(),
          client_phone: clientPhone.trim(),
          client_city: clientCity.trim(),
          project_description: projectDescription.trim(),
        });

      if (insertError) throw insertError;

      // Send email notification to artisan
      if (artisanEmail) {
        await supabase.functions.invoke("send-project-request-email", {
          body: {
            artisanEmail,
            artisanName,
            clientName: clientName.trim(),
            clientPhone: clientPhone.trim(),
            clientCity: clientCity.trim(),
            projectDescription: projectDescription.trim(),
          },
        });
      }

      setIsSubmitted(true);
      toast.success("Votre demande a \u00e9t\u00e9 envoy\u00e9e !");
    } catch (error) {
      console.error("Error submitting project request:", error);
      toast.error("Erreur lors de l'envoi. Veuillez r\u00e9essayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Demande envoy\u00e9e !</h3>
          <p className="text-sm text-muted-foreground">
            <strong>{artisanName}</strong> a \u00e9t\u00e9 notifi\u00e9 et vous recontactera rapidement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Audit reassurance */}
        {isAudited && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <Shield className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <p className="text-xs text-success font-medium leading-relaxed">
              Vous contactez un artisan audit\u00e9 sur le terrain. Votre demande est prioritaire.
            </p>
          </div>
        )}

        <div className="text-center mb-1">
          <p className="text-sm text-muted-foreground">Besoin d'un devis ?</p>
          <p className="text-xl font-bold text-primary">Contactez {artisanName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name" className="text-sm">Votre nom *</Label>
            <Input
              id="contact-name"
              placeholder="Jean Dupont"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              maxLength={100}
            />
            {errors.clientName && <p className="text-xs text-destructive">{errors.clientName}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-phone" className="text-sm">T\u00e9l\u00e9phone *</Label>
            <FrenchPhoneInput
              value={clientPhone}
              onChange={setClientPhone}
              error={!!errors.clientPhone}
            />
            {errors.clientPhone && <p className="text-xs text-destructive">{errors.clientPhone}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-city" className="text-sm flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Votre ville *
            </Label>
            <Input
              id="contact-city"
              placeholder="Paris, Lyon, Marseille..."
              value={clientCity}
              onChange={(e) => setClientCity(e.target.value)}
              maxLength={100}
            />
            {errors.clientCity && <p className="text-xs text-destructive">{errors.clientCity}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-desc" className="text-sm">Votre projet *</Label>
            <Textarea
              id="contact-desc"
              placeholder="D\u00e9crivez bri\u00e8vement les travaux souhait\u00e9s..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            {errors.projectDescription && <p className="text-xs text-destructive">{errors.projectDescription}</p>}
            <p className="text-xs text-muted-foreground text-right">{projectDescription.length}/500</p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer ma demande
              </>
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            Gratuit et sans engagement. Vos donn\u00e9es restent confidentielles.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default ArtisanContactForm;
