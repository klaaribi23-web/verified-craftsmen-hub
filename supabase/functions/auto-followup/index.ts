import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Auto Follow-up Edge Function
 * Sends automated follow-up emails to prospects who clicked their magic link
 * but haven't created an account yet.
 * 
 * Schedule: J+1, J+3, J+7 after first click
 * Trigger: Called via pg_cron
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
    const results = { sent: 0, skipped: 0, errors: 0 };

    // Get artisans who are still in "suspended" status (clicked but not converted)
    // and have NOT created an account (user_id is null)
    const { data: prospects, error } = await supabase
      .from("artisans")
      .select("id, business_name, city, email, reminder_sent_at, reminder_count, created_at")
      .eq("status", "suspended")
      .is("user_id", null)
      .not("email", "is", null);

    if (error) {
      console.error("Error fetching prospects:", error);
      throw error;
    }

    if (!prospects || prospects.length === 0) {
      return new Response(JSON.stringify({ message: "No prospects to follow up", ...results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Follow-up schedule: reminder_count 0→J+1, 1→J+3, 2→J+7
    const SCHEDULE_DAYS = [1, 3, 7];
    const MAX_REMINDERS = 3;

    for (const prospect of prospects) {
      const reminderCount = prospect.reminder_count || 0;

      // Max reminders reached
      if (reminderCount >= MAX_REMINDERS) {
        results.skipped++;
        continue;
      }

      // Calculate when the next reminder should be sent
      const baseDate = prospect.reminder_sent_at
        ? new Date(prospect.reminder_sent_at)
        : new Date(prospect.created_at);

      const daysSinceBase = (now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24);
      const requiredDays = SCHEDULE_DAYS[reminderCount] || 7;

      if (daysSinceBase < requiredDays) {
        results.skipped++;
        continue;
      }

      // Send follow-up email
      const subject = reminderCount === 0
        ? `${prospect.business_name}, votre fiche attend votre validation`
        : reminderCount === 1
          ? `Dernière chance : vos clients vous cherchent sur ${prospect.city}`
          : `⚠️ Votre exclusivité sur ${prospect.city} expire bientôt`;

      const html = generateFollowUpEmail(
        prospect.business_name,
        prospect.city,
        prospect.email!,
        reminderCount
      );

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Andrea — Artisans Validés <contact@artisansvalides.fr>",
            to: [prospect.email],
            subject,
            html,
          }),
        });

        if (emailRes.ok) {
          // Update reminder tracking
          await supabase
            .from("artisans")
            .update({
              reminder_sent_at: now.toISOString(),
              reminder_count: reminderCount + 1,
              updated_at: now.toISOString(),
            })
            .eq("id", prospect.id);

          results.sent++;
          console.log(`[FOLLOWUP] Sent reminder #${reminderCount + 1} to ${prospect.email}`);
        } else {
          const errBody = await emailRes.text();
          console.error(`[FOLLOWUP] Email failed for ${prospect.email}:`, errBody);
          results.errors++;
        }
      } catch (emailErr) {
        console.error(`[FOLLOWUP] Error sending to ${prospect.email}:`, emailErr);
        results.errors++;
      }
    }

    console.log(`[FOLLOWUP] Complete: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[FOLLOWUP] Fatal error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateFollowUpEmail(
  businessName: string,
  city: string,
  email: string,
  reminderIndex: number
): string {
  const magicLink = `https://verified-craftsmen-hub.lovable.app/activation-artisan-elite?email=${encodeURIComponent(email)}&nom=${encodeURIComponent(businessName)}&ville=${encodeURIComponent(city)}&source=relance`;

  const urgencyText = reminderIndex === 0
    ? "Votre fiche professionnelle a été préparée par notre équipe. Il ne reste plus qu'une étape pour commencer à recevoir des demandes de clients."
    : reminderIndex === 1
      ? "Des clients recherchent activement un artisan sur votre secteur. Votre fiche est prête mais inactive — vos concurrents captent ces opportunités à votre place."
      : "Dernière notification : votre exclusivité sur la zone de " + city + " sera libérée et proposée à un concurrent si vous ne validez pas votre accès.";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; color: #e5e5e5; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #141414; border-radius: 16px; border: 1px solid #333; padding: 32px;">
    <h1 style="font-size: 20px; font-weight: 800; color: #f0a500; margin: 0 0 16px;">
      ${reminderIndex >= 2 ? "⚠️" : "👋"} ${businessName}
    </h1>
    
    <p style="font-size: 14px; line-height: 1.6; color: #a1a1a1; margin: 0 0 24px;">
      ${urgencyText}
    </p>

    <a href="${magicLink}" 
       style="display: block; text-align: center; background: #f0a500; color: #0a0a0a; padding: 14px 24px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
      ACTIVER MA FICHE SUR ${city.toUpperCase()}
    </a>

    <p style="font-size: 11px; color: #666; margin: 20px 0 0; text-align: center;">
      2 artisans max par ville et par métier. Places limitées.
    </p>
  </div>
  
  <p style="font-size: 10px; color: #444; text-align: center; margin-top: 24px;">
    Artisans Validés — Réseau d'artisans sélectionnés<br>
    <a href="https://verified-craftsmen-hub.lovable.app" style="color: #666;">artisansvalides.fr</a>
  </p>
</body>
</html>`;
}
