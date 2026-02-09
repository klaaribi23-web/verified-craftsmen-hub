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

/**
 * Extracts structured data from Andrea's conversation text.
 * This parses agent responses looking for extracted fields.
 */
export const extractLeadInfo = (text: string, current: LeadData): Partial<LeadData> => {
  const updates: Partial<LeadData> = {};

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

  // Detect lead type from conversation
  if (!current.lead_type) {
    const lower = text.toLowerCase();
    if (lower.includes("particulier") || lower.includes("projet") || lower.includes("travaux") || lower.includes("rénovation")) {
      updates.lead_type = "particulier";
    } else if (lower.includes("artisan") || lower.includes("chantier") || lower.includes("entreprise") || lower.includes("société")) {
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

  const processAgentText = useCallback(
    (text: string) => {
      const updates = extractLeadInfo(text, leadData);
      if (Object.keys(updates).length > 0) {
        updateLead(updates);
      }
    },
    [leadData, updateLead]
  );

  const saveLead = useCallback(
    async (conversationId?: string, sourcePage?: string) => {
      if (savedRef.current || isSaving) return;
      if (!leadData.lead_type) return;

      // Phone is MANDATORY — never save without it
      if (!leadData.telephone) return;

      setIsSaving(true);
      savedRef.current = true;

      try {
        const { data, error } = await supabase.functions.invoke("save-andrea-lead", {
          body: {
            lead_type: leadData.lead_type,
            data: leadData,
            conversation_id: conversationId,
            source_page: sourcePage,
          },
        });

        if (error) throw error;
        setSavedId(data?.id || null);
        console.log("[LeadCapture] Lead saved:", data?.id);
      } catch (err) {
        console.error("[LeadCapture] Save failed:", err);
        savedRef.current = false; // Allow retry
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
    saveLead,
    resetLead,
    isSaving,
    savedId,
    completionPercent,
  };
};
