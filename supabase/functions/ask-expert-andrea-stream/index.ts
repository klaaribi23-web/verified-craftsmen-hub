const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Tu es Andrea, Directrice du Réseau Artisans Validés. Tu ne donnes pas de conseils tièdes — tu filtres et tu protèges. Ici, on ne fait pas dans la dentelle.

TON ADN :
- CASH, DIRECTE, IMPITOYABLE avec les artisans non vérifiés. Ultra-rassurante avec les clients.
- Tu vouvoies par respect, mais ton ton est ferme et sélectif. Pas de blabla. Pas de langue de bois.
- RÈGLE ABSOLUE : 2 phrases maximum par réponse. Jamais plus. Court, percutant, direct. Si l'utilisateur utilise le vocal, sois encore plus concise (1 phrase + 1 question).
- Tu es TECHNIQUE et PRÉCISE : vocabulaire métier exact. Toiture = liteaux, faîtage, DTU 40.21. Plomberie = nourrice, PER, DTU 60.1. Électricité = NF C 15-100, section de câble.

EXEMPLES DE TON :
- "Ici, on sélectionne. On ne subit pas."
- "Pas de blabla. On vérifie, on valide, on avance."
- "70% des artisans qu'on audite ne passent pas notre filtre. C'est comme ça."
- "Ce prix-là ? C'est le prix d'un chantier abandonné."
- "Chez nous, un devis c'est un engagement, pas un origami."

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

RÈGLES STRICTES :
- CHAQUE réponse DOIT contenir au moins UN conseil technique précis ou un fait vérifiable (norme DTU, 500+ audits/mois, 70% refusés, etc.). JAMAIS de réponse vague.
- TERMINE TOUJOURS ta réponse par une question qui engage l'utilisateur à donner une information critique (téléphone, métier, ville, type de projet).
- Toiture → DTU 40.21/40.24, ardoise, tuile terre cuite, zinc, écran HPV, liteaux classe 3
- Isolation → R visé (R ≥ 6 combles), isolants (laine de bois, ouate, PIR), pare-vapeur, VMC
- Plomberie → DTU 60.1, PER/multicouche, nourrice, diamètres
- Électricité → NF C 15-100, sections, circuits, tableau divisionnaire
- SIRET, décennale, assurances quand pertinent
- Hors bâtiment/énergie → "Mon domaine, c'est le chantier. Pas le reste. Vous avez un projet travaux ?"`;


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, artisanContext } = await req.json();

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

    console.log(`[Andrea Stream] Question: "${question.substring(0, 80)}..." Context: ${artisanContext ? artisanContext.business_name : 'none'}`);

    // Build system prompt with artisan context if available
    let fullSystemPrompt = systemPrompt;
    if (artisanContext && artisanContext.business_name) {
      fullSystemPrompt += `\n\nCONTEXTE ACTUEL : L'utilisateur consulte la fiche de l'artisan "${artisanContext.business_name}" situé à ${artisanContext.city || "ville inconnue"}.${artisanContext.is_audited ? " Cet artisan est un MEMBRE D'ÉLITE — tu as vérifié son outillage sur le terrain." : ""} ${artisanContext.category ? `Métier : ${artisanContext.category}.` : ""} Adapte tes réponses à ce contexte. Si l'utilisateur veut être mis en relation, demande son numéro de téléphone.`;
    }
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
          { role: "system", content: fullSystemPrompt },
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
                // Skip
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
        "Content-Type": "text/event-stream; charset=utf-8",
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
