import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { lead_type, data, conversation_id, source_page } = body;

    console.log("[save-andrea-lead] Received:", { lead_type, conversation_id, source_page });

    if (!lead_type || !data) {
      return new Response(JSON.stringify({ error: "Missing lead_type or data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let insertResult;

    if (lead_type === "particulier") {
      const { data: inserted, error } = await supabase
        .from("leads_particuliers")
        .insert([{
          nom: data.nom || null,
          prenom: data.prenom || null,
          telephone: data.telephone || null,
          email: data.email || null,
          ville: data.ville || null,
          code_postal: data.code_postal || null,
          type_projet: data.type_projet || null,
          description_projet: data.description_projet || null,
          budget_estime: data.budget_estime || null,
          delai: data.delai || null,
          source_page: source_page || null,
          conversation_id: conversation_id || null,
          notes: data.notes || null,
        }])
        .select()
        .single();

      if (error) throw error;
      insertResult = inserted;
    } else if (lead_type === "artisan") {
      const { data: inserted, error } = await supabase
        .from("leads_artisans")
        .insert([{
          nom: data.nom || null,
          prenom: data.prenom || null,
          societe: data.societe || null,
          telephone: data.telephone || null,
          email: data.email || null,
          ville: data.ville || null,
          code_postal: data.code_postal || null,
          departement: data.departement || null,
          metier: data.metier || null,
          specialites: data.specialites || null,
          annees_existence: data.annees_existence || null,
          nombre_salaries: data.nombre_salaries || null,
          siret: data.siret || null,
          a_assurance: data.a_assurance || null,
          chiffre_affaires: data.chiffre_affaires || null,
          source_page: source_page || null,
          conversation_id: conversation_id || null,
          notes: data.notes || null,
        }])
        .select()
        .single();

      if (error) throw error;
      insertResult = inserted;
    } else {
      return new Response(JSON.stringify({ error: "Invalid lead_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[save-andrea-lead] Saved lead:", insertResult?.id);

    // Send notification email if lead has enough data
    const hasContact = data.telephone || data.email;
    if (hasContact) {
      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const resend = new Resend(resendKey);
          const typeLabel = lead_type === "particulier" ? "Particulier" : "Artisan";
          const nameLabel = [data.prenom, data.nom, data.societe].filter(Boolean).join(" ") || "Non renseigné";

          await resend.emails.send({
            from: "Andrea IA <onboarding@resend.dev>",
            to: ["contact@artisansvalides.com"],
            subject: `[Andrea] Nouveau lead ${typeLabel} — ${nameLabel}`,
            html: `
              <h2>Nouveau lead ${typeLabel} qualifié par Andrea</h2>
              <table style="border-collapse:collapse;width:100%">
                ${Object.entries(data)
                  .filter(([, v]) => v != null && v !== "")
                  .map(([k, v]) => `<tr><td style="padding:4px 8px;font-weight:bold;border:1px solid #ddd">${k}</td><td style="padding:4px 8px;border:1px solid #ddd">${v}</td></tr>`)
                  .join("")}
              </table>
              <p style="margin-top:16px;color:#666">Source: ${source_page || "inconnue"} · Conversation: ${conversation_id || "N/A"}</p>
            `,
          });
          console.log("[save-andrea-lead] Email sent");
        }
      } catch (emailErr) {
        console.warn("[save-andrea-lead] Email failed:", emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true, id: insertResult?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[save-andrea-lead] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
