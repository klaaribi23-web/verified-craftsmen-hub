import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderResult {
  artisanId: string;
  businessName: string;
  email: string;
  success: boolean;
  error?: string;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Artisans Validés <contact@artisans-valides.fr>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`Failed to send email: ${errorData}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    const { daysThreshold = 2, dryRun = false } = await req.json().catch(() => ({}));

    // Calculate the cutoff date (activation_sent_at older than X days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    // Find artisans in waiting state who:
    // 1. Have activation_sent_at set (received pre-registration email)
    // 2. activation_sent_at is older than threshold
    // 3. Have not received a reminder recently (reminder_sent_at is null or older than threshold)
    // 4. Status is still 'prospect' (haven't created account yet) or 'pending' with no docs
    const { data: artisansToRemind, error: fetchError } = await supabase
      .from("artisans")
      .select(`
        id,
        business_name,
        email,
        activation_sent_at,
        reminder_sent_at,
        reminder_count,
        status
      `)
      .not("activation_sent_at", "is", null)
      .lt("activation_sent_at", cutoffDate.toISOString())
      .or(`reminder_sent_at.is.null,reminder_sent_at.lt.${cutoffDate.toISOString()}`)
      .in("status", ["prospect", "pending"])
      .not("email", "is", null)
      .order("activation_sent_at", { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch artisans: ${fetchError.message}`);
    }

    console.log(`Found ${artisansToRemind?.length || 0} artisans to check`);

    // Filter out artisans who have already uploaded documents
    const artisansWithoutDocs: typeof artisansToRemind = [];
    
    for (const artisan of artisansToRemind || []) {
      const { count } = await supabase
        .from("artisan_documents")
        .select("*", { count: "exact", head: true })
        .eq("artisan_id", artisan.id);
      
      if (count === 0) {
        artisansWithoutDocs.push(artisan);
      }
    }

    console.log(`${artisansWithoutDocs.length} artisans without documents need reminders`);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          artisansToRemind: artisansWithoutDocs.map(a => ({
            id: a.id,
            businessName: a.business_name,
            email: a.email,
            activationSentAt: a.activation_sent_at,
            reminderCount: a.reminder_count || 0
          }))
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results: ReminderResult[] = [];

    for (const artisan of artisansWithoutDocs) {
      try {
        const reminderNumber = (artisan.reminder_count || 0) + 1;
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Rappel</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px;">Bonjour <strong>${artisan.business_name}</strong>,</p>
              
              <p style="font-size: 16px;">
                Nous avons remarqué que vous n'avez pas encore finalisé votre inscription sur Artisans Validés.
              </p>
              
              <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>Pour activer votre compte, il vous reste à :</strong>
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Créer votre compte avec le lien d'activation reçu</li>
                  <li>Télécharger vos documents professionnels (Kbis, assurance, etc.)</li>
                </ul>
              </div>
              
              <p style="font-size: 16px;">
                Une fois vos documents validés par notre équipe, votre profil sera visible par des milliers de clients potentiels !
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 14px; color: #6b7280;">
                  Vous n'avez pas reçu le lien d'activation ? Contactez-nous à 
                  <a href="mailto:contact@artisans-valides.fr" style="color: #f97316;">contact@artisans-valides.fr</a>
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                Ceci est un rappel automatique (${reminderNumber}${reminderNumber === 1 ? 'er' : 'ème'} rappel).
                <br>L'équipe Artisans Validés
              </p>
            </div>
          </body>
          </html>
        `;

        await sendEmail(
          artisan.email,
          "Rappel : Finalisez votre inscription sur Artisans Validés",
          emailHtml
        );

        // Update reminder tracking
        await supabase
          .from("artisans")
          .update({
            reminder_sent_at: new Date().toISOString(),
            reminder_count: reminderNumber
          })
          .eq("id", artisan.id);

        results.push({
          artisanId: artisan.id,
          businessName: artisan.business_name,
          email: artisan.email,
          success: true
        });

        console.log(`Reminder sent to ${artisan.business_name} (${artisan.email})`);
      } catch (emailError: any) {
        console.error(`Failed to send reminder to ${artisan.email}:`, emailError);
        results.push({
          artisanId: artisan.id,
          businessName: artisan.business_name,
          email: artisan.email,
          success: false,
          error: emailError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          sent: successCount,
          failed: failCount
        },
        results
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reminder-emails:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
