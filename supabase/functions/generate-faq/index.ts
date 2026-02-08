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
    const { city, category } = await req.json();

    if (!city && !category) {
      return new Response(
        JSON.stringify({ error: "city or category is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const locationLabel = city || "votre ville";
    const categoryLabel = category || "artisan du bâtiment";

    const systemPrompt = `Tu es un expert en travaux et rénovation en France. Tu génères du contenu FAQ utile et SEO-friendly pour aider les particuliers à choisir un artisan. Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks. Le JSON doit avoir cette structure exacte :
{
  "title": "string - titre de la FAQ incluant la ville",
  "questions": [
    {
      "question": "string",
      "answer": "string (2-3 phrases max, concret et actionnable)"
    }
  ]
}`;

    const userPrompt = `Génère une FAQ de 3 à 5 questions pour aider un particulier à choisir un bon ${categoryLabel} à ${locationLabel}. 
Inclus des conseils pratiques : vérifications à faire, pièges à éviter, questions à poser.
Le titre doit être du type "X points à vérifier avant de choisir votre ${categoryLabel} à ${locationLabel}".
Adapte le contenu au métier et à la localisation.`;

    console.log(`Generating FAQ for city: ${city}, category: ${category}`);

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

    // Parse the JSON from the AI response
    const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const faqData = JSON.parse(cleanedContent);

    console.log(`FAQ generated successfully: ${faqData.questions?.length} questions`);

    return new Response(JSON.stringify(faqData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-faq error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
