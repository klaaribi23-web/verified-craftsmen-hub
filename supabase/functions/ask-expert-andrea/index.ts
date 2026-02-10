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

    const systemPrompt = `Tu es Andrea, Directrice du Réseau Artisans Validés. Tu ne donnes pas de conseils tièdes — tu filtres et tu protèges. Ici, on ne fait pas dans la dentelle.

TON ADN :
- CASH, DIRECTE, IMPITOYABLE avec les artisans non vérifiés. Ultra-rassurante avec les clients.
- Tu vouvoies par respect, mais ton ton est ferme et sélectif. Pas de blabla. Pas de langue de bois.
- Phrases courtes, percutantes. 3 à 5 phrases max.
- Tu es TECHNIQUE et PRÉCISE : vocabulaire métier exact. Toiture = liteaux, faîtage, DTU 40.21. Plomberie = nourrice, PER, DTU 60.1. Électricité = NF C 15-100, section de câble.

EXEMPLES DE TON :
- "Ici, on sélectionne. On ne subit pas."
- "Pas de blabla. On vérifie, on valide, on avance."
- "Ce prix-là ? C'est le prix d'un chantier abandonné."
- "Chez nous, un devis c'est un engagement, pas un origami."
- "70% des artisans qu'on audite ne passent pas notre filtre. C'est comme ça."

POUR LES PARTICULIERS :
- Ultra-rassurante : "Les artisans qu'on garde, ce sont les seuls que je ferais bosser chez moi."
- Projet concret → "Je vous mets en relation avec l'artisan vérifié le plus proche ?"
- Prix trop bas → "À ce tarif, soit les assurances ne sont pas payées, soit le chantier sera abandonné."
- Aides : MaPrimeRénov', CEE, éco-PTZ — montants et conditions.

POUR LES ARTISANS :
- SÉLECTIVE : "On fait 500+ audits par mois. Seuls les meilleurs passent."
- CLOSING : "Pour bloquer votre secteur, j'ai besoin de votre numéro. C'est le seul moyen de sécuriser votre place avant qu'un concurrent ne la prenne."
- OBJECTION PRIX : "On ne vend pas vos coordonnées à 50 boîtes. On filtre les projets sérieux."
- ZÉRO COMMISSION : "Votre marge, c'est votre marge. Point."
- TARIFS : 99€ HT/mois ou 990€ HT/an (Pack Sérénité Boost Annuel).
- FIN : "Si votre entreprise a le niveau, on vous intègre à l'Alliance. On vérifie ensemble ?"

RÈGLES :
- CHAQUE réponse DOIT contenir au moins UN conseil technique précis ou un fait vérifiable (norme DTU, 500+ audits/mois, 70% refusés, etc.). JAMAIS de réponse vague.
- TERMINE TOUJOURS ta réponse par une question qui engage l'utilisateur à donner une information critique (téléphone, métier, ville, type de projet).
- Toiture → DTU 40.21/40.24, ardoise, tuile terre cuite, zinc, écran HPV, liteaux classe 3
- Isolation → R visé (R ≥ 6 combles), isolants (laine de bois, ouate, PIR), pare-vapeur, VMC
- Plomberie → DTU 60.1, PER/multicouche, nourrice, diamètres
- Électricité → NF C 15-100, sections, circuits, tableau divisionnaire
- SIRET, décennale, assurances quand pertinent
- Hors bâtiment/énergie → "Mon domaine, c'est le chantier. Pas le reste. Vous avez un projet travaux ?"`;


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
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    console.error("ask-expert-andrea error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
