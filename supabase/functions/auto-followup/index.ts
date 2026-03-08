import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Auto Follow-up Edge Function — 5-Step Sequence
 * 
 * Step 1 (J+1): Soft reminder — "Votre fiche attend validation"
 * Step 2 (J+3): Social proof — "Des clients cherchent sur votre zone"
 * Step 3 (J+5): Urgency — "Votre exclusivité expire bientôt"
 * Step 4 (J+10): Last chance — "Un concurrent va prendre votre place"
 * Step 5 (J+15): Final — "Nous libérons votre créneau"
 * 
 * Also covers STOCK (status=disponible) prospects with an initial outreach.
 * 
 * Schedule: Called via pg_cron daily
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const results = { sent: 0, skipped: 0, errors: 0, stock_sent: 0 };

    // ═══════════════════════════════════════════════
    // PART 1: Follow-up for SUSPENDED (EN COURS) prospects
    // ═══════════════════════════════════════════════
    const { data: suspendedProspects } = await supabase
      .from("artisans")
      .select("id, business_name, city, email, reminder_sent_at, reminder_count, created_at")
      .eq("status", "suspended")
      .is("user_id", null)
      .not("email", "is", null);

    const SCHEDULE_DAYS = [1, 3, 5, 10, 15];
    const MAX_REMINDERS = 5;

    for (const prospect of suspendedProspects || []) {
      const reminderCount = prospect.reminder_count || 0;
      if (reminderCount >= MAX_REMINDERS) { results.skipped++; continue; }

      const baseDate = prospect.reminder_sent_at
        ? new Date(prospect.reminder_sent_at)
        : new Date(prospect.created_at);
      const daysSinceBase = (now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
      const requiredDays = SCHEDULE_DAYS[reminderCount] || 15;

      if (daysSinceBase < requiredDays) { results.skipped++; continue; }

      const subject = getSubject(prospect.business_name, prospect.city, reminderCount);
      const html = generateFollowUpEmail(prospect.business_name, prospect.city, prospect.email!, reminderCount);

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: "Andrea — Artisans Validés <equipe@artisansvalides.fr>",
            to: [prospect.email],
            subject,
            html,
          }),
        });

        if (emailRes.ok) {
          await supabase.from("artisans").update({
            reminder_sent_at: now.toISOString(),
            reminder_count: reminderCount + 1,
            updated_at: now.toISOString(),
          }).eq("id", prospect.id);
          results.sent++;
          console.log(`[FOLLOWUP] Sent step ${reminderCount + 1}/5 to ${prospect.email}`);
        } else {
          const errBody = await emailRes.text();
          console.error(`[FOLLOWUP] Email failed for ${prospect.email}:`, errBody);
          results.errors++;
        }
      } catch (e) {
        console.error(`[FOLLOWUP] Error for ${prospect.email}:`, e);
        results.errors++;
      }
    }

    // ═══════════════════════════════════════════════
    // PART 2: Initial outreach for STOCK (disponible) prospects
    // Never contacted before (reminder_count = 0, no reminder_sent_at)
    // ═══════════════════════════════════════════════
    const { data: stockProspects } = await supabase
      .from("artisans")
      .select("id, business_name, city, email, reminder_count, created_at")
      .eq("status", "disponible")
      .is("user_id", null)
      .is("reminder_sent_at", null)
      .not("email", "is", null)
      .order("created_at", { ascending: true })
      .limit(20); // Process 20 STOCK per day max

    for (const prospect of stockProspects || []) {
      const magicLink = `https://verified-craftsmen-hub.lovable.app/activation-artisan-elite?email=${encodeURIComponent(prospect.email!)}&nom=${encodeURIComponent(prospect.business_name)}&ville=${encodeURIComponent(prospect.city)}&source=auto-stock`;

      const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:40px 20px;">
  <div style="max-width:500px;margin:0 auto;background:#141414;border-radius:16px;border:1px solid #333;padding:32px;">
    <h1 style="font-size:20px;font-weight:800;color:#f0a500;margin:0 0 16px;">
      🏆 ${prospect.business_name}, vous avez été sélectionné
    </h1>
    <p style="font-size:14px;line-height:1.6;color:#a1a1a1;margin:0 0 24px;">
      Notre équipe a identifié votre entreprise comme un professionnel de confiance sur <strong style="color:#e5e5e5;">${prospect.city}</strong>. 
      Nous avons préparé votre fiche professionnelle — il ne reste qu'à la valider.
    </p>
    <p style="font-size:13px;line-height:1.6;color:#a1a1a1;margin:0 0 24px;">
      <strong style="color:#f0a500;">2 places max par ville et par métier.</strong> Votre créneau est réservé pour 48h.
    </p>
    <a href="${magicLink}" style="display:block;text-align:center;background:#f0a500;color:#0a0a0a;padding:14px 24px;border-radius:12px;font-weight:800;text-decoration:none;font-size:14px;text-transform:uppercase;letter-spacing:1px;">
      DÉCOUVRIR MA FICHE →
    </a>
    <p style="font-size:11px;color:#666;margin:20px 0 0;text-align:center;">
      Gratuit · Sans engagement · 30 secondes
    </p>
  </div>
  <p style="font-size:10px;color:#444;text-align:center;margin-top:24px;">
    Artisans Validés — Réseau d'artisans sélectionnés<br>
    <a href="https://verified-craftsmen-hub.lovable.app" style="color:#666;">artisansvalides.fr</a>
  </p>
</body></html>`;

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: "Andrea — Artisans Validés <equipe@artisansvalides.fr>",
            to: [prospect.email],
            subject: `${prospect.business_name}, votre fiche pro sur ${prospect.city} est prête`,
            html,
          }),
        });

        if (emailRes.ok) {
          // Move to PENDING (CONTACTÉ)
          await supabase.from("artisans").update({
            status: "pending",
            reminder_sent_at: now.toISOString(),
            reminder_count: 1,
            updated_at: now.toISOString(),
          }).eq("id", prospect.id);
          results.stock_sent++;
          console.log(`[FOLLOWUP-STOCK] Sent initial outreach to ${prospect.email}`);
        } else {
          results.errors++;
        }
      } catch {
        results.errors++;
      }
    }

    console.log(`[FOLLOWUP] Complete: suspended=${results.sent} sent, stock=${results.stock_sent}, skipped=${results.skipped}, errors=${results.errors}`);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[FOLLOWUP] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getSubject(name: string, city: string, step: number): string {
  switch (step) {
    case 0: return `${name}, votre fiche attend votre validation`;
    case 1: return `Des clients cherchent sur ${city} — votre place est réservée`;
    case 2: return `⚠️ Votre exclusivité sur ${city} expire bientôt`;
    case 3: return `🔴 ${name} — un concurrent peut prendre votre place demain`;
    case 4: return `Dernier message : nous libérons votre créneau sur ${city}`;
    default: return `${name}, rappel important`;
  }
}

function generateFollowUpEmail(businessName: string, city: string, email: string, step: number): string {
  const magicLink = `https://verified-craftsmen-hub.lovable.app/activation-artisan-elite?email=${encodeURIComponent(email)}&nom=${encodeURIComponent(businessName)}&ville=${encodeURIComponent(city)}&source=relance-${step + 1}`;

  const bodies = [
    // Step 1: Soft
    `Votre fiche professionnelle a été préparée par notre équipe. Il ne reste plus qu'une étape pour commencer à recevoir des demandes de clients qualifiés sur <strong style="color:#e5e5e5;">${city}</strong>.`,
    // Step 2: Social proof
    `Des clients recherchent activement un artisan sur votre secteur de <strong style="color:#e5e5e5;">${city}</strong>. Votre fiche est prête mais inactive — vos concurrents captent ces opportunités à votre place.`,
    // Step 3: Urgency
    `Votre exclusivité sur la zone de <strong style="color:#e5e5e5;">${city}</strong> est en sursis. Nous ne pouvons pas la réserver indéfiniment — un autre professionnel a manifesté son intérêt.`,
    // Step 4: Last chance
    `C'est notre avant-dernier message. Un concurrent de votre zone a démarré le processus d'activation. Si vous souhaitez conserver votre place exclusive sur <strong style="color:#e5e5e5;">${city}</strong>, c'est maintenant.`,
    // Step 5: Final
    `Nous libérons votre créneau sur <strong style="color:#e5e5e5;">${city}</strong> demain soir. Si vous souhaitez toujours être référencé comme artisan de confiance sur cette zone, validez votre accès ci-dessous.`,
  ];

  const emoji = step >= 3 ? "⚠️" : "👋";
  const body = bodies[step] || bodies[4];
  const ctaText = step >= 3 ? "DERNIÈRE CHANCE — ACTIVER" : "ACTIVER MA FICHE";

  return `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#0a0a0a;color:#e5e5e5;padding:40px 20px;">
  <div style="max-width:500px;margin:0 auto;background:#141414;border-radius:16px;border:1px solid ${step >= 3 ? '#8b0000' : '#333'};padding:32px;">
    <h1 style="font-size:20px;font-weight:800;color:#f0a500;margin:0 0 16px;">
      ${emoji} ${businessName}
    </h1>
    <p style="font-size:14px;line-height:1.6;color:#a1a1a1;margin:0 0 24px;">
      ${body}
    </p>
    <a href="${magicLink}" style="display:block;text-align:center;background:${step >= 3 ? '#dc2626' : '#f0a500'};color:${step >= 3 ? '#fff' : '#0a0a0a'};padding:14px 24px;border-radius:12px;font-weight:800;text-decoration:none;font-size:14px;text-transform:uppercase;letter-spacing:1px;">
      ${ctaText} SUR ${city.toUpperCase()}
    </a>
    <p style="font-size:11px;color:#666;margin:20px 0 0;text-align:center;">
      2 artisans max par ville et par métier. Places limitées.
    </p>
  </div>
  <p style="font-size:10px;color:#444;text-align:center;margin-top:24px;">
    Artisans Validés — Réseau d'artisans sélectionnés<br>
    <a href="https://verified-craftsmen-hub.lovable.app" style="color:#666;">artisansvalides.fr</a>
  </p>
</body></html>`;
}
