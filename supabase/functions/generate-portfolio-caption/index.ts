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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { businessName, metier, city, department } = await req.json();

    if (!businessName || !city) {
      return new Response(JSON.stringify({ error: "businessName and city are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
            content: `Tu g\u00e9n\u00e8res des l\u00e9gendes courtes et professionnelles pour des photos/stories d'artisans du b\u00e2timent.

R\u00e8gles strictes :
- Maximum 120 caract\u00e8res
- Structure obligatoire : [Action/M\u00e9tier] + [Type de mat\u00e9riel/travail] + [\u00e0 Ville (D\u00e9partement)]
- Ton professionnel mais accessible
- Pas de guillemets
- Utilise des verbes d'action : "Installation", "R\u00e9novation", "Pose", "Cr\u00e9ation", "R\u00e9paration", "Am\u00e9nagement"
- Mentionne un mat\u00e9riau ou type de travail sp\u00e9cifique au m\u00e9tier
- Termine TOUJOURS par "[\u00e0/\u00e0] [Ville] ([Code d\u00e9partement])"
- Une seule phrase`
          },
          {
            role: "user",
            content: `G\u00e9n\u00e8re une l\u00e9gende g\u00e9o-centr\u00e9e pour cette story artisan :
- Entreprise : ${businessName}
- M\u00e9tier : ${metier || "artisan du b\u00e2timent"}
- Ville : ${city}${deptSuffix}

Exemple de format attendu : "Installation de panneaux solaires monocristallins r\u00e9alis\u00e9e par nos \u00e9quipes \u00e0 ${city}${deptSuffix}."`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requ\u00eates, r\u00e9essayez dans quelques instants." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Cr\u00e9dits IA insuffisants." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let caption = data.choices?.[0]?.message?.content?.trim() || "";
    // Remove surrounding quotes if present
    caption = caption.replace(/^["']|["']$/g, "");

    console.log("Generated caption:", caption);

    return new Response(
      JSON.stringify({ caption }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
