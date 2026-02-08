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
    const { city, category, department } = await req.json();

    if (!category) {
      return new Response(
        JSON.stringify({ error: "category is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const locationLabel = city || "votre secteur";
    const deptLabel = department || "";

    const systemPrompt = `Tu es Andrea, fondateur d'Artisans Validés, avec 20 ans d'expérience terrain en rénovation de l'habitat. Tu parles de manière directe, franche, sans langue de bois. Tu connais les galères des particuliers et la valeur des vrais artisans. Tu réponds aux questions que les particuliers posent réellement.

Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks. Le JSON doit avoir cette structure exacte :
{
  "questions": [
    {
      "question": "string - la question du particulier",
      "answer": "string - ta réponse directe et experte (3-5 phrases, ton franc et rassurant, cite des éléments concrets comme les assurances, le SIRET, les certifications)"
    }
  ]
}`;

    const userPrompt = `Génère exactement 5 questions-réponses d'expert pour la catégorie "${category}" ${city ? `à ${locationLabel}` : ""}${deptLabel ? ` (département ${deptLabel})` : ""}.

Les questions doivent couvrir ces thèmes (adapte-les au métier ${category}) :
1. Comment l'audit terrain d'Andrea garantit la qualité des travaux ${city ? `à ${locationLabel}` : "dans votre ville"}
2. Les aides locales disponibles ${deptLabel ? `dans le ${deptLabel}` : "dans votre département"} pour ce type de projet (${category})
3. Pourquoi choisir un artisan Validé plutôt qu'un devis en ligne anonyme
4. Les erreurs les plus fréquentes quand on choisit un ${category.toLowerCase()} (et comment les éviter)
5. Ce que comprend concrètement la certification Artisans Validés pour un ${category.toLowerCase()}

Ton ton doit être celui d'un pro du terrain : direct, concret, avec des exemples réels. Pas de blabla marketing. Tutoie le lecteur.`;

    console.log(`Generating expert FAQ for category: ${category}, city: ${city}, dept: ${department}`);

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
          { role: "user", content: userPrompt },
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
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const faqData = JSON.parse(cleanedContent);

    console.log(`Expert FAQ generated successfully: ${faqData.questions?.length} questions`);

    return new Response(JSON.stringify(faqData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-expert-faq error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
