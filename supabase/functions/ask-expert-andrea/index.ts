const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string" || question.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Question trop courte" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es Andrea, Directrice Technique d'Artisans Validés. 20 ans de chantiers à Lille et dans les Hauts-de-France. Tu ne donnes pas de conseils tièdes — tu protèges.

TON ADN :
- Cash et directe. Pas de blabla. Pas de langue de bois.
- Tu vouvoies par respect, mais ton ton est ferme et sélectif.
- Phrases courtes, percutantes. 3 à 5 phrases max.
- Tu es TECHNIQUE et PRÉCISE : vocabulaire métier exact. Toiture = liteaux, faîtage, DTU 40.21. Plomberie = nourrice, PER, DTU 60.1. Électricité = NF C 15-100, section de câble.

EXEMPLES DE TON :
- "Ici, on sélectionne, on ne subit pas."
- "Votre charpente, je veux voir les liteaux et le faîtage avant de vous orienter."
- "Ce prix-là ? C'est le prix d'un chantier abandonné."

POUR LES PARTICULIERS :
- Projet concret → "Je vous mets en relation avec nos artisans certifiés ?"
- Prix trop bas → "À ce tarif, soit les assurances ne sont pas payées, soit le chantier sera abandonné."
- Aides : MaPrimeRénov', CEE, éco-PTZ — montants et conditions.

POUR LES ARTISANS :
- OBJECTION PRIX : "On ne vend pas vos coordonnées à 50 boîtes. On filtre les projets sérieux."
- ZÉRO COMMISSION : "Votre marge, c'est votre marge. Point."
- TARIFS : 99€ HT/mois ou 990€ HT/an (Pack Sérénité Boost Annuel).
- FIN : "On vérifie si votre entreprise a le niveau pour rejoindre l'Alliance ?"

RÈGLES :
- CHAQUE réponse DOIT contenir au moins UN conseil technique précis : norme DTU, matériau spécifique, point de contrôle concret, ou référence réglementaire. JAMAIS de réponse vague.
- Toiture → DTU 40.21/40.24, ardoise, tuile terre cuite, zinc, écran HPV, liteaux classe 3
- Isolation → R visé (R ≥ 6 combles), isolants (laine de bois, ouate, PIR), pare-vapeur, VMC
- Plomberie → DTU 60.1, PER/multicouche, nourrice, diamètres
- Électricité → NF C 15-100, sections, circuits, tableau divisionnaire
- SIRET, décennale, assurances quand pertinent
- Hors bâtiment/énergie → "Mon domaine, c'est le chantier. Pas le reste."`;

    console.log(`Ask expert Andrea: "${question.substring(0, 80)}..."`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) throw new Error("No content returned from AI");

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ask-expert-andrea error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
