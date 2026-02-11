import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- In-memory rate limiter ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limit: 10 expert FAQ generations per IP per hour
  const ip = getClientIp(req);
  if (!checkRateLimit(ip, 10, 60 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ error: "Trop de requêtes. Réessayez plus tard." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { city, category, department } = await req.json();

    if (!category) {
      return new Response(
        JSON.stringify({ error: "category is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input lengths
    if ((city?.length || 0) > 100 || (category?.length || 0) > 100 || (department?.length || 0) > 100) {
      return new Response(
        JSON.stringify({ error: "Input too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const locationLabel = city || "votre secteur";
    const deptLabel = department || "";

    const systemPrompt = `Tu es Andrea, Directrice Technique d'Artisans Validés, avec 20 ans d'expérience terrain en rénovation de l'habitat dans les Hauts-de-France. Tu parles avec un ton direct, honnête et chaleureux — comme une associée de confiance, pas comme un robot. Tu connais les galères des particuliers et la valeur des vrais artisans. Tu glisses des termes techniques (DTU, décennale, règles de l'art) et une touche d'humour du Nord. Côté particulier, tu es ultra-rassurante : "Je ne vous envoie que quelqu'un que je ferais bosser chez moi."

Réponds UNIQUEMENT en JSON valide, sans markdown ni backticks. Le JSON doit avoir cette structure exacte :
{
  "questions": [
    {
      "question": "string - la question du particulier",
      "answer": "string - ta réponse directe et experte (3-5 phrases, ton franc et rassurant, cite des éléments concrets comme les assurances, le SIRET, les certifications)"
    }
  ],
  "nearby_cities": ["string - 3 à 5 villes voisines de la ville mentionnée, réelles et géographiquement proches"]
}`;

    const userPrompt = `Génère exactement 5 questions-réponses d'expert pour la catégorie "${category}" ${city ? `à ${locationLabel}` : ""}${deptLabel ? ` (département ${deptLabel})` : ""}.

Les questions doivent couvrir ces thèmes (adapte-les au métier ${category}) :
1. Comment l'audit terrain d'Andrea garantit la qualité des travaux ${city ? `à ${locationLabel}` : "dans votre ville"}
2. Les aides locales disponibles ${deptLabel ? `dans le ${deptLabel}` : "dans votre département"} pour ce type de projet (${category})
3. Pourquoi choisir un artisan Validé plutôt qu'un devis en ligne anonyme
4. Les erreurs les plus fréquentes quand on choisit un ${category.toLowerCase()} (et comment les éviter)
5. Quel est le prix moyen d'un ${category.toLowerCase()} ${city ? `à ${locationLabel}` : ""} et comment éviter les arnaques

IMPORTANT - RÈGLES OBLIGATOIRES POUR CHAQUE RÉPONSE :
- Chaque réponse DOIT mentionner au moins une ville locale (${city ? `${locationLabel}, ou une ville voisine comme Lille, Tourcoing, Roubaix` : "Lille, Tourcoing, Roubaix"}).
- Au moins 2 réponses doivent aborder le prix ou la sécurité (assurance décennale, conformité).
- Exemple de mention locale : "À ${city || "Lille"}, je constate que les tarifs moyens pour un ${category.toLowerCase()} tournent autour de..."

${city ? `Inclus dans "nearby_cities" 3 à 5 villes géographiquement proches de ${locationLabel}. Ce doivent être de vraies villes françaises.` : 'Mets un tableau vide pour "nearby_cities".'}

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
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    console.error("generate-expert-faq error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
