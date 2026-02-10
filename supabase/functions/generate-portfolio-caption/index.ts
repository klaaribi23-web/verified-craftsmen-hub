import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
    }

    const { businessName, metier, city, department } = await req.json();

    if (!businessName || !city) {
      return new Response(JSON.stringify({ error: "businessName and city are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const deptCode = department || "";
    const deptSuffix = deptCode ? ` (${deptCode})` : "";

    console.log(`Generating geo caption for: ${businessName} - ${metier} - ${city}${deptSuffix}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu génères des légendes courtes et professionnelles pour des photos/stories d'artisans du bâtiment.

Règles strictes :
- Maximum 120 caractères
- Structure obligatoire : [Action/Métier] + [Type de matériel/travail] + [à Ville (Département)]
- Ton professionnel mais accessible
- Pas de guillemets
- Utilise des verbes d'action : "Installation", "Rénovation", "Pose", "Création", "Réparation", "Aménagement"
- Mentionne un matériau ou type de travail spécifique au métier
- Termine TOUJOURS par "[à] [Ville] ([Code département])"
- Une seule phrase`
          },
          {
            role: "user",
            content: `Génère une légende géo-centrée pour cette story artisan :
- Entreprise : ${businessName}
- Métier : ${metier || "artisan du bâtiment"}
- Ville : ${city}${deptSuffix}

Exemple de format attendu : "Installation de panneaux solaires monocristallins réalisée par nos équipes à ${city}${deptSuffix}."`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
      }
      
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
    }

    const data = await response.json();
    let caption = data.choices?.[0]?.message?.content?.trim() || "";
    // Remove surrounding quotes if present
    caption = caption.replace(/^["']|["']$/g, "");

    console.log("Generated caption:", caption);

    return new Response(
      JSON.stringify({ caption }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } }
    );
  }
});
