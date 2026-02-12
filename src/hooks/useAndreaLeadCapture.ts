import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LeadData {
  lead_type: "particulier" | "artisan" | null;
  // Common
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  ville?: string;
  code_postal?: string;
  // Particulier specific
  type_projet?: string;
  description_projet?: string;
  budget_estime?: string;
  delai?: string;
  // Artisan specific
  societe?: string;
  metier?: string;
  specialites?: string;
  annees_existence?: number;
  nombre_salaries?: string;
  siret?: string;
  a_assurance?: boolean;
  chiffre_affaires?: string;
  departement?: string;
}

const PHONE_REGEX = /(?:(?:\+33|0033|0)\s*[1-9](?:[\s.-]*\d{2}){4})/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const POSTAL_REGEX = /\b((?:0[1-9]|[1-8]\d|9[0-5]|97[1-6])\d{3})\b/;
const SIRET_REGEX = /\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/;

// Common French first names for extraction
const PRENOM_INTRO = /(?:je (?:m'appelle|suis)|mon (?:prénom|nom)(?:\s+(?:c'est|est))?\s+)([A-ZÀ-ÿ][a-zà-ÿ]+)/i;
const NOM_INTRO = /(?:nom (?:de famille\s+)?(?:c'est|est)\s+)([A-ZÀ-ÿ][a-zà-ÿ]+)/i;

/**
 * Extracts structured data from Andrea's conversation text.
 * Parses both user messages and agent responses for lead fields.
 */
export const extractLeadInfo = (text: string, current: LeadData): Partial<LeadData> => {
  const updates: Partial<LeadData> = {};
  const lower = text.toLowerCase();

  // Phone extraction
  const phoneMatch = text.match(PHONE_REGEX);
  if (phoneMatch && !current.telephone) {
    updates.telephone = phoneMatch[0].replace(/[\s.-]/g, "");
  }

  // Email extraction
  const emailMatch = text.match(EMAIL_REGEX);
  if (emailMatch && !current.email) {
    updates.email = emailMatch[0];
  }

  // Postal code extraction
  const postalMatch = text.match(POSTAL_REGEX);
  if (postalMatch && !current.code_postal) {
    updates.code_postal = postalMatch[1];
    // Derive department from postal code
    if (!current.departement) {
      updates.departement = postalMatch[1].substring(0, 2);
    }
  }

  // SIRET extraction
  const siretMatch = text.match(SIRET_REGEX);
  if (siretMatch && !current.siret) {
    updates.siret = siretMatch[1].replace(/\s/g, "");
  }

  // First name extraction
  const prenomMatch = text.match(PRENOM_INTRO);
  if (prenomMatch && !current.prenom) {
    updates.prenom = prenomMatch[1];
  }

  // Last name extraction
  const nomMatch = text.match(NOM_INTRO);
  if (nomMatch && !current.nom) {
    updates.nom = nomMatch[1];
  }

  // City extraction from common patterns
  const villeMatch = text.match(/(?:j'habite|je suis (?:à|de|basé à)|(?:ma )?ville[:\s]+|situé(?:e)?\s+à\s+)([A-ZÀ-ÿ][a-zà-ÿ]+(?:[- ][A-ZÀ-ÿ][a-zà-ÿ]+)*)/i);
  if (villeMatch && !current.ville) {
    updates.ville = villeMatch[1];
  }

  // Budget extraction
  const budgetMatch = text.match(/(\d[\d\s]*(?:€|euros?|k€?|000\s*€?))/i);
  if (budgetMatch && !current.budget_estime) {
    updates.budget_estime = budgetMatch[1].trim();
  }

  // Company name extraction
  const societeMatch = text.match(/(?:ma (?:société|entreprise|boîte)(?:\s+(?:s'appelle|c'est|est))?\s+)([A-ZÀ-ÿ][\w\s&'-]+)/i);
  if (societeMatch && !current.societe) {
    updates.societe = societeMatch[1].trim();
  }

  // Trade/métier extraction
  const metierKeywords = ["plombier", "électricien", "maçon", "peintre", "carreleur", "chauffagiste", "menuisier", "couvreur", "serrurier", "charpentier", "plaquiste", "façadier"];
  if (!current.metier) {
    for (const m of metierKeywords) {
      if (lower.includes(m)) {
        updates.metier = m.charAt(0).toUpperCase() + m.slice(1);
        break;
      }
    }
  }

  // Project type extraction
  const projetKeywords = ["rénovation", "construction", "extension", "isolation", "plomberie", "électricité", "peinture", "carrelage", "toiture", "salle de bain", "cuisine", "terrasse"];
  if (!current.type_projet) {
    for (const p of projetKeywords) {
      if (lower.includes(p)) {
        updates.type_projet = p.charAt(0).toUpperCase() + p.slice(1);
        break;
      }
    }
  }

  // Detect lead type from conversation
  if (!current.lead_type) {
    if (lower.includes("particulier") || lower.includes("projet") || lower.includes("travaux") || lower.includes("rénovation") || lower.includes("devis")) {
      updates.lead_type = "particulier";
    } else if (lower.includes("artisan") || lower.includes("chantier") || lower.includes("entreprise") || lower.includes("société") || lower.includes("siret")) {
      updates.lead_type = "artisan";
    }
  }

  return updates;
};

export const useAndreaLeadCapture = () => {
  const [leadData, setLeadData] = useState<LeadData>({ lead_type: null });
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const savedRef = useRef(false);

  const updateLead = useCallback((updates: Partial<LeadData>) => {
    setLeadData((prev) => ({ ...prev, ...updates }));
  }, []);

  const processText = useCallback(
    (text: string) => {
      const updates = extractLeadInfo(text, leadData);
      if (Object.keys(updates).length > 0) {
        updateLead(updates);
      }
    },
    [leadData, updateLead]
  );

  // Process both user AND agent messages
  const processAgentText = processText;
  const processUserText = processText;

  const saveLead = useCallback(
    async (conversationId?: string, sourcePage?: string, forceDraft = false) => {
      if (savedRef.current || isSaving) return;
      if (!leadData.lead_type) return;

      // Allow draft saves without phone, full saves require phone
      if (!forceDraft && !leadData.telephone) return;

      setIsSaving(true);
      if (!forceDraft) savedRef.current = true;

      try {
        const payload = {
          lead_type: leadData.lead_type,
          data: {
            ...leadData,
            // Mark as draft if no phone yet
            notes: !leadData.telephone ? "[BROUILLON] Conversation en cours — téléphone non encore saisi" : (leadData as any).notes,
          },
          conversation_id: conversationId,
          source_page: sourcePage,
        };

        console.log("[LeadCapture] Saving lead:", { type: leadData.lead_type, draft: forceDraft, hasPhone: !!leadData.telephone });

        const { data, error } = await supabase.functions.invoke("save-andrea-lead", {
          body: payload,
        });

        if (error) {
          console.error("[LeadCapture] Erreur écriture base de données:", error);
          throw error;
        }
        if (!forceDraft) {
          setSavedId(data?.id || null);
        }
        console.log("[LeadCapture] Lead sauvegardé:", data?.id, forceDraft ? "(brouillon)" : "(final)");
      } catch (err) {
        console.error("[LeadCapture] Échec sauvegarde en base:", err);
        if (!forceDraft) savedRef.current = false;
      } finally {
        setIsSaving(false);
      }
    },
    [leadData, isSaving]
  );

  const resetLead = useCallback(() => {
    setLeadData({ lead_type: null });
    setSavedId(null);
    savedRef.current = false;
  }, []);

  const completionPercent = (() => {
    if (!leadData.lead_type) return 0;
    const fields =
      leadData.lead_type === "particulier"
        ? ["nom", "telephone", "ville", "type_projet", "budget_estime"]
        : ["nom", "societe", "telephone", "ville", "metier", "annees_existence"];
    const filled = fields.filter((f) => (leadData as any)[f] != null && (leadData as any)[f] !== "").length;
    return Math.round((filled / fields.length) * 100);
  })();

  return {
    leadData,
    updateLead,
    processAgentText,
    processUserText,
    saveLead,
    resetLead,
    isSaving,
    savedId,
    completionPercent,
  };
};
