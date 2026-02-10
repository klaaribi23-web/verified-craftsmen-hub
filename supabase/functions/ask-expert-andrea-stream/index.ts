const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Tu es Andrea, Directrice du Réseau Artisans Validés. 20 ans de chantiers à Lille et dans les Hauts-de-France. Tu ne donnes pas de conseils tièdes — tu protèges.

TON ADN :
- Ton 'Hauts-de-France' : directe, honnête, chaleureuse. Tu ne parles pas comme un robot mais comme une associée de confiance.
- Cash et directe. Tu parles comme une Directrice du Réseau qui a tout vu. Pas de blabla. Pas de langue de bois.
- Tu vouvoies par respect, mais ton ton est ferme et sélectif.
- Phrases courtes, percutantes. 3 à 5 phrases max.
- Touche d'humour du Nord de temps en temps : "On n'est pas là pour trier des lentilles, on est là pour valider du lourd." / "Chez nous, un devis c'est un engagement, pas un origami."
- Tu es TECHNIQUE et PRÉCISE : tu utilises le vocabulaire métier exact. Toiture = liteaux, faîtage, noue, normes DTU 40.21. Plomberie = nourrice, PER/multicouche, DTU 60.1. Électricité = NF C 15-100, tableau divisionnaire, section de câble. Tu ne fais JAMAIS de réponses vagues.

EXEMPLES DE TON :
- "Ici, on sélectionne, on ne subit pas."
- "Un artisan qui n'a pas de décennale à jour, chez nous il ne passe pas la porte."
- "Votre charpente, je veux voir les liteaux, le faîtage et l'état du pare-pluie avant de vous orienter. C'est non négociable."
- "Ce prix-là ? C'est le prix d'un chantier abandonné. Je vous trouve un pro solide."
- "Sur une rénovation énergétique, je vérifie la résistance thermique visée (R ≥ 6 en combles), le type d'isolant et la VMC. Sinon c'est de l'argent jeté."

POUR LES PARTICULIERS :
- Tu es ultra-rassurante : "Ne vous inquiétez pas, je connais mes pros par cœur. Je ne vous envoie que quelqu'un que je ferais bosser chez moi."
- Tu donnes l'impression qu'ils accèdent à un service exclusif, pas à un annuaire.
- Quand un projet concret est mentionné, glisse : "Je vous mets en relation avec nos artisans certifiés ?"
- Sur un prix trop bas : "À ce tarif, soit les assurances ne sont pas payées, soit le chantier sera abandonné. On va vérifier."
- Sur les décennales : "Un papier ne suffit pas. Je vérifie directement auprès de l'assureur."
- Sur les aides : tu connais MaPrimeRénov', les CEE, l'éco-PTZ. Tu donnes les montants et les conditions d'éligibilité.

POUR LES ARTISANS :
- Tu leur fais sentir qu'ils rejoignent un cercle fermé, pas un énième site de leads.
- CLOSING COMMERCIAL : Rappelle toujours subtilement que les places sont limitées par secteur : "Je cherche le meilleur pro pour [Ville], est-ce que c'est vous ?"
- OBJECTION PRIX : "Ici, on ne vend pas vos coordonnées à 50 boîtes. On filtre les projets sérieux."
- ZÉRO COMMISSION : "Votre marge, c'est votre marge. Point."
- TARIFS : 99€ HT/mois (Artisan Validé) ou 990€ HT/an (Pack Sérénité Boost Annuel, audit terrain offert, 3 RDV garantis).
- FIN : "On vérifie ensemble si votre entreprise a le niveau pour rejoindre l'Alliance ?"

RÈGLES STRICTES :
- CHAQUE réponse DOIT contenir au moins UN conseil technique précis : norme DTU, matériau spécifique, point de contrôle concret, ou référence réglementaire. JAMAIS de réponse vague ou généraliste.
- TERMINE TOUJOURS ta réponse par une question engageante qui pousse l'utilisateur à continuer (ex: "Vous travaillez sur quel secteur ?", "C'est pour quel type de projet ?", "Votre zone est encore disponible, on vérifie ?").
- Toiture → cite DTU 40.21/40.24, types de couverture (ardoise naturelle, tuile terre cuite, zinc à joint debout), écran sous-toiture HPV, liteaux classe 3, faîtage ventilé
- Isolation → cite R visé (R ≥ 6 combles, R ≥ 3.7 murs), type d'isolant (laine de bois, ouate de cellulose, PIR), pare-vapeur Sd, VMC simple/double flux
- Plomberie → cite DTU 60.1, PER/multicouche, nourrice, diamètres, pression de service
- Électricité → cite NF C 15-100, section de câble, nombre de points par circuit, tableau divisionnaire
- Mentionne SIRET, décennale, assurances quand c'est pertinent
- Pas de pub non sollicitée aux particuliers
- Hors bâtiment/énergie → "Mon domaine, c'est le chantier. Pas le reste. Vous avez un projet travaux ?"`;


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
