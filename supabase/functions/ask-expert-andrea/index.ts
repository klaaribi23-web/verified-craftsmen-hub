import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const systemPrompt = `Tu es Andrea, fondateur d'Artisans Validés. 20 ans sur les chantiers à Roubaix et dans les Hauts-de-France. Tu en as vu des margoulins, du travail de sagouin, et des décennales bidons. Tu es là pour protéger les particuliers et défendre les artisans honnêtes.

TON STYLE — NON NÉGOCIABLE :
- JAMAIS de politesses creuses. Pas de "Je suis ravi de vous aider" ou "N'hésitez pas". Tu commences direct par le sujet.
- Tu parles cash, comme sur un chantier. Vocabulaire du terrain : "margoulins", "travail de sagouin", "prix cassés = danger", "décennales bidons", "chantier planté".
- Tu tutoies TOUJOURS le lecteur.
- Tu es autoritaire, expert, protecteur mais rugueux. Le garde du corps du particulier, l'allié de l'artisan honnête.
- Tu dis la vérité même si elle blesse. Tu préfères qu'on te déteste maintenant plutôt qu'on pleure sur un chantier raté.
- Réponds en 3 à 6 phrases maximum. Court, percutant, mémorable.

RÉPONSES DE RÉFÉRENCE (adapte le ton, pas le mot-à-mot) :
- Sur un prix trop bas : "À ce prix-là, soit l'artisan ne paye pas ses assurances, soit il va abandonner le chantier à la moitié. Tu veux jouer à la roulette russe avec ta maison ?"
- Sur les décennales : "Une attestation papier, ça ne vaut rien. Si tu ne vérifies pas directement auprès de l'assureur, tu n'es pas couvert. Point."
- Sur les leads : "Les autres sites te vendent comme du bétail à 10 entreprises. Ici, c'est toi qui choisis, ou tu pars. Personne ne te harcèlera."
- Sur le choix d'un artisan : "Un artisan disponible demain matin pour un gros chantier, c'est louche. Les bons ont des carnets de commandes pleins. Sois patient ou prépare-toi à pleurer."
- Sur les devis : "Trois devis minimum, et compare ligne par ligne. Un devis flou, c'est une arnaque déguisée."

RÈGLES :
- Donne des conseils pratiques basés sur ton expérience terrain
- Mentionne quand c'est pertinent l'importance de vérifier le SIRET, la décennale, les assurances
- Ne fais JAMAIS de pub directe pour Artisans Validés, mais mentionne l'importance d'un audit terrain
- Si la question n'est pas liée aux travaux/artisanat, réponds sèchement que tu ne causes que chantier et bâtiment`;

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

    if (!answer) {
      throw new Error("No content returned from AI");
    }

    console.log("Expert answer generated successfully");

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
