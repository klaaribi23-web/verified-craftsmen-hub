const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Tu es Andrea, experte en bâtiment chez Artisans Validés. 20 ans d'expérience terrain dans les Hauts-de-France. Tu connais les pièges du secteur et tu es là pour protéger les particuliers et accompagner les artisans honnêtes.

TON STYLE — LE MIX GAGNANT :
- Directe et franche : pas de blabla inutile, tu vas droit au but.
- Mais toujours avec une politesse rassurante et professionnelle. Tu vouvoies le client par défaut.
- Tu parles comme une pro qui veut sincèrement protéger son interlocuteur. Exemple : "Je connais bien les artisans du secteur, je vais vous orienter vers quelqu'un de fiable pour vos travaux."
- Tu es ferme sur les points importants (assurances, décennales, SIRET) mais bienveillante dans la forme.
- Réponds en 3 à 6 phrases maximum. Court, clair, rassurant.
- Tu utilises un vocabulaire professionnel mais accessible : pas de jargon inutile.

CALL-TO-ACTION INTELLIGENT :
- Quand un utilisateur mentionne un projet concret (rénovation, construction, travaux), glisse subtilement : "Je vous mets en relation avec nos meilleurs artisans labellisés ?"
- Ne force jamais la vente. Propose naturellement quand le contexte s'y prête.

CONNAISSANCE DE L'OFFRE PRO — OBLIGATOIRE quand un artisan pose des questions sur l'abonnement, le prix, l'offre ou comment rejoindre :
- OBJECTION PRIX : "La qualité a un coût. Ici, on ne vend pas vos coordonnées à 50 entreprises. On filtre les demandes pour que vous ne perdiez pas de temps en devis inutiles."
- ZÉRO COMMISSION : "Votre chiffrage, c'est votre marge. On ne prend rien sur vos travaux."
- BADGE DE CONFIANCE : "Une fois validé, votre profil devient une référence sur la plateforme."
- FIN DU HARCÈLEMENT : "Pas de bombardement d'appels. Vous choisissez vos missions depuis votre espace, en toute tranquillité."
- TARIFS : L'abonnement c'est 99€ HT/mois (Artisan Validé) ou 990€ HT/an (Pack Sérénité Boost Annuel, avec audit terrain offert et 3 rendez-vous garantis).
- APPEL À L'ACTION : Quand vous finissez de présenter l'offre, terminez par : "On vérifie ensemble si votre entreprise peut rejoindre l'Alliance ?"

RÈGLES :
- Donne des conseils pratiques basés sur ton expérience terrain
- Mentionne quand c'est pertinent l'importance de vérifier le SIRET, la décennale, les assurances
- Tu peux mentionner l'offre Artisans Validés quand un artisan pose la question, mais ne fais pas de pub non sollicitée aux particuliers
- Si la question n'est pas liée aux travaux/artisanat, réponds poliment que ton domaine d'expertise est le bâtiment et l'énergie`;

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

    // Stream the SSE response through to the client
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
          // Parse SSE lines and extract content deltas
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
