// Deno.serve used below
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PreregistrationRequest {
  artisanId: string;
  artisanEmail: string;
  artisanName: string;
}

const getEmailTemplate = (artisanName: string, activationUrl: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnostic terminé — ${artisanName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #060C18;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #0A192F; border-radius: 16px; overflow: hidden; border: 1px solid rgba(212,175,55,0.2);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 36px; border-bottom: 1px solid rgba(212,175,55,0.12);">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="font-size: 13px; font-weight: 900; color: #ffffff; letter-spacing: 3px;">ARTISANS VALIDÉS</td>
                  <td style="text-align: right;">
                    <span style="font-size: 9px; font-weight: 800; color: #D4AF37; letter-spacing: 2px; padding: 6px 14px; border: 1px solid rgba(212,175,55,0.3); border-radius: 4px;">DIAGNOSTIC PRÊT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Hook — Attention -->
          <tr>
            <td style="padding: 36px 36px 16px; text-align: center;">
              <p style="color: #D4AF37; font-size: 11px; font-weight: 700; letter-spacing: 2px; margin: 0 0 12px; text-transform: uppercase;">
                Analyse de secteur terminée
              </p>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 8px; line-height: 1.3;">
                ${artisanName}, votre zone est encore libre.
              </h1>
              <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">
                Mais un concurrent est en file d'attente.
              </p>
            </td>
          </tr>
          
          <!-- Intérêt — Value props -->
          <tr>
            <td style="padding: 24px 36px;">
              <table role="presentation" style="width: 100%; border-spacing: 0;">
                <tr>
                  <td style="padding: 14px 16px; background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.12); border-radius: 10px; margin-bottom: 10px;">
                    <p style="color: #ffffff; font-size: 13px; font-weight: 700; margin: 0 0 4px;">🏦 Actif Numérique Prêt</p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0; line-height: 1.6;">Votre fiche optimisée SEO est en ligne. Les clients de votre ville peuvent déjà vous trouver.</p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 14px 16px; background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.12); border-radius: 10px;">
                    <p style="color: #ffffff; font-size: 13px; font-weight: 700; margin: 0 0 4px;">🛑 Exclusivité Sectorielle</p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0; line-height: 1.6;">Un seul artisan par zone et par métier. Celui qui active en premier verrouille le secteur.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Désir — CTA -->
          <tr>
            <td style="padding: 8px 36px 16px; text-align: center;">
              <a href="${activationUrl}" 
                 style="display: inline-block; background: #D4AF37; color: #0A192F; font-size: 16px; font-weight: 900; text-decoration: none; padding: 18px 44px; border-radius: 10px; letter-spacing: 1px;">
                  VOIR MON DIAGNOSTIC →
              </a>
            </td>
          </tr>

          <!-- Action — Urgence -->
          <tr>
            <td style="padding: 0 36px 28px; text-align: center;">
              <p style="color: #EF4444; font-size: 12px; font-weight: 700; margin: 0;">
                ⚠️ Priorité sectorielle : expiration sous 48h
              </p>
            </td>
          </tr>
          
          <!-- Lien fallback -->
          <tr>
            <td style="padding: 0 36px 24px;">
              <p style="color: rgba(255,255,255,0.3); font-size: 11px; line-height: 1.6; margin: 0;">
                Si le bouton ne fonctionne pas :<br>
                <a href="${activationUrl}" style="color: #D4AF37; word-break: break-all;">${activationUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
              <p style="color: rgba(255,255,255,0.3); font-size: 10px; margin: 0;">
                Andrea · IA d'audit · <a href="mailto:contact@artisansvalides.fr" style="color: #D4AF37;">contact@artisansvalides.fr</a>
              </p>
              <p style="color: rgba(255,255,255,0.15); font-size: 9px; margin: 8px 0 0;">
                © ${new Date().getFullYear()} Artisans Validés — Réseau d'Excellence
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { artisanId, artisanEmail, artisanName }: PreregistrationRequest = await req.json();

    if (!artisanId || !artisanEmail || !artisanName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a unique activation token
    const activationToken = crypto.randomUUID();

    // Update artisan with activation token and change status to pending
    const { error: updateError } = await supabase
      .from("artisans")
      .update({
        activation_token: activationToken,
        status: "pending",
        activation_sent_at: new Date().toISOString(),
      })
      .eq("id", artisanId);

    if (updateError) {
      console.error("Error updating artisan:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update artisan" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build activation URL
    const baseUrl = "https://artisansvalides.fr";
    const activationUrl = `${baseUrl}/activer-compte?token=${activationToken}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Artisans Validés <noreply@artisansvalides.fr>",
      to: [artisanEmail],
      subject: `${artisanName} — Votre diagnostic de secteur est prêt`,
      html: getEmailTemplate(artisanName, activationUrl),
    });

    console.log("Pre-registration email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-preregistration-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
