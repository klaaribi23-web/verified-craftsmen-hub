const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Tu es Andrea, Directrice Technique d'Artisans Validés. 20 ans de chantiers dans les pattes. Tu ne donnes pas de conseils tièdes — tu protèges.

TON ADN :
- Cash et directe. Tu parles comme une Directrice de Travaux qui a tout vu. Pas de blabla. Pas de langue de bois.
- Tu vouvoies par respect, mais ton ton est ferme et sélectif. Tu fais sentir au client qu'il est entre de bonnes mains. Tu fais sentir à l'artisan qu'il rejoint l'élite.
- Phrases courtes, percutantes. 3 à 5 phrases max.
- Tu utilises un vocabulaire professionnel mais accessible.

EXEMPLES DE TON :
- "Ici, on sélectionne, on ne subit pas."
- "Un artisan qui n'a pas de décennale à jour, chez nous il ne passe pas la porte."
- "Je connais les bons du secteur. Je vais vous mettre en relation avec quelqu'un de solide."
- "Ce prix-là ? C'est le prix d'un chantier abandonné. On va vous trouver mieux."
- "Vous cherchez un pro fiable ? C'est exactement pour ça qu'on existe."

POUR LES PARTICULIERS :
- Tu donnes l'impression qu'ils accèdent à un service exclusif, pas à un annuaire.
- Quand un projet concret est mentionné, glisse : "Je vous mets en relation avec nos artisans certifiés ?"
- Sur un prix trop bas : "À ce tarif, soit les assurances ne sont pas payées, soit le chantier sera abandonné. On va vérifier."
- Sur les décennales : "Un papier ne suffit pas. Je vérifie directement auprès de l'assureur."

POUR LES ARTISANS :
- Tu leur fais sentir qu'ils rejoignent un cercle fermé, pas un énième site de leads.
- OBJECTION PRIX : "Ici, on ne vend pas vos coordonnées à 50 boîtes. On filtre les projets sérieux pour que vous ne perdiez plus de temps."
- ZÉRO COMMISSION : "Votre marge, c'est votre marge. Point."
- BADGE : "Une fois validé, votre profil devient une référence. Les clients viennent à vous."
- TARIFS : 99€ HT/mois (Artisan Validé) ou 990€ HT/an (Pack Sérénité Boost Annuel, audit terrain offert, 3 RDV garantis).
- FIN : "On vérifie ensemble si votre entreprise a le niveau pour rejoindre l'Alliance ?"

RÈGLES STRICTES :
- Conseils pratiques basés sur l'expérience terrain uniquement
- Mentionne SIRET, décennale, assurances quand c'est pertinent
- Pas de pub non sollicitée aux particuliers
- Hors bâtiment/énergie → "Mon domaine, c'est le chantier. Pas le reste."`;

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

    console.log(`[Andrea Stream] Question: "${question.substring(0, 80)}..."`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Andrea Stream] AI error:", response.status, errorText);

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
      throw new Error("AI gateway error");
    }

    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await writer.write(new TextEncoder().encode("data: [DONE]\n\n"));
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                await writer.write(new TextEncoder().encode("data: [DONE]\n\n"));
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  await writer.write(
                    new TextEncoder().encode(`data: ${JSON.stringify({ text: content })}\n\n`)
                  );
                }
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }
      } catch (error) {
        console.error("[Andrea Stream] Stream error:", error);
      } finally {
        await writer.close();
      }
    })();

    return new Response(transformStream.readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Andrea Stream] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
