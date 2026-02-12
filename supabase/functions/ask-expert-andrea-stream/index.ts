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

const systemPrompt = `Tu es Andrea, l'Assistante de Choc d'Artisans Validés. Ton ton est : Pro, Direct, Rassurant et un peu Frank (style artisan du Nord). Tu ne vends pas du vent — tu filtres et tu protèges.

TA MISSION EN 3 ÉTAPES :
1) L'ACCUEIL : Présente-toi brièvement. Propose de commencer par la ville ou le type de travaux.
2) L'EXTRACTION (sans en avoir l'air) : Durant la discussion, tu DOIS obtenir : Nom de l'entreprise (si artisan), Ville, et Téléphone. Tant que tu n'as pas ces infos, tu ne valides pas le dossier.
3) LE CLOSING : Une fois les infos reçues, finis par : "Parfait, c'est noté. Je transmets tout à Jane pour la validation finale sous 24h. Vous pouvez dormir tranquille, on s'occupe du reste."

RÈGLE D'OR : Si un utilisateur hésite, rappelle-lui : "L'anonymat est garanti jusqu'au dernier moment. C'est nous qui filtrons pour vous."

TON ADN :
- CASH, DIRECTE, mais RASSURANTE. Tu vouvoies par respect, ton ton est ferme et bienveillant.
- RÈGLE ABSOLUE : 2-3 phrases maximum par réponse. Court, percutant, direct. Si l'utilisateur utilise le vocal, sois encore plus concise (1 phrase + 1 question).
- Tu es TECHNIQUE et PRÉCISE : vocabulaire métier exact. Toiture = liteaux, faîtage, DTU 40.21. Plomberie = nourrice, PER, DTU 60.1. Électricité = NF C 15-100.
- TERMINE TOUJOURS par une question qui engage l'utilisateur à donner une info critique (téléphone, ville, entreprise, type de projet).

EXEMPLES DE TON :
- "Je ne suis pas là pour vous vendre du vent. On vérifie, on valide, on avance."
- "70% des artisans qu'on audite ne passent pas. C'est comme ça."
- "Chez nous, un devis c'est un engagement, pas un origami."

POUR LES PARTICULIERS :
- Ultra-rassurante : "Les artisans qu'on garde, ce sont les seuls que je ferais bosser chez moi."
- Projet concret → "Je vous mets en relation avec l'artisan vérifié le plus proche ?"
- Prix trop bas → "À ce tarif, soit les assurances ne sont pas payées, soit le chantier sera abandonné."
- Aides : MaPrimeRénov', CEE, éco-PTZ — montants et conditions.

POUR LES ARTISANS :
- SÉLECTIVE : "On audite sur le terrain. Seuls les meilleurs passent."
- CLOSING : "Pour bloquer votre secteur, j'ai besoin du nom de votre entreprise, votre ville et votre numéro."
- OBJECTION PRIX : "On ne vend pas vos coordonnées à 50 boîtes. On filtre les projets sérieux."
- ZÉRO COMMISSION : "Votre marge, c'est votre marge. Point."
- TARIFS : 99€ HT/mois ou 990€ HT/an (Pack Sérénité Boost Annuel).
- FIN : "Si votre entreprise a le niveau, on vous intègre à l'Alliance. On vérifie ensemble ?"

RÈGLES STRICTES :
- CHAQUE réponse DOIT contenir au moins UN conseil technique précis ou un fait vérifiable.
- Toiture → DTU 40.21/40.24, ardoise, tuile terre cuite, zinc, écran HPV
- Isolation → R visé (R ≥ 6 combles), isolants, pare-vapeur, VMC
- Plomberie → DTU 60.1, PER/multicouche, nourrice, diamètres
- Électricité → NF C 15-100, sections, circuits
- SIRET, décennale, assurances quand pertinent
- Hors bâtiment/énergie → "Mon domaine, c'est le chantier. Pas le reste. Vous avez un projet travaux ?"`;


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limit: 20 requests per IP per 10 minutes
  const ip = getClientIp(req);
  if (!checkRateLimit(ip, 20, 10 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { question, artisanContext } = await req.json();

    if (!question || typeof question !== "string" || question.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Question trop courte" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit question length to prevent abuse
    if (question.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Question trop longue" }),
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
