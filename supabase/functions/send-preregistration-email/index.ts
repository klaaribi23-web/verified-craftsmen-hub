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
  <title>Votre fiche Artisans Validés est prête !</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px; font-weight: 700;">
                🎉 Votre fiche est prête !
              </h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 0;">
                Artisans Validés
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333; font-size: 18px; line-height: 1.6; margin: 0 0 20px;">
                Bonjour <strong>${artisanName}</strong>,
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bonne nouvelle ! Votre fiche artisan a été créée sur <strong>Artisans Validés</strong>, 
                la plateforme de mise en relation entre particuliers et artisans de confiance.
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Pour finaliser votre inscription et accéder à votre espace personnel, 
                cliquez sur le bouton ci-dessous pour créer votre mot de passe :
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${activationUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #1a365d; font-size: 18px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(212,175,55,0.3);">
                      Activer mon compte
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <p style="color: #1a365d; font-size: 16px; font-weight: 600; margin: 0 0 15px;">
                  ✨ Ce que vous pourrez faire :
                </p>
                <ul style="color: #555; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Gérer votre profil et vos informations</li>
                  <li>Recevoir des demandes de devis de clients</li>
                  <li>Échanger directement avec les particuliers</li>
                  <li>Obtenir le badge "Artisan Validé" après vérification</li>
                </ul>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                <a href="${activationUrl}" style="color: #d4af37; word-break: break-all;">${activationUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
              <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                Des questions ? Contactez-nous à 
                <a href="mailto:contact@artisansvalides.fr" style="color: #d4af37;">contact@artisansvalides.fr</a>
              </p>
              <p style="color: #aaa; font-size: 12px; margin: 15px 0 0; text-align: center;">
                © 2025 Artisans Validés - Tous droits réservés
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
      subject: "🎉 Votre fiche Artisans Validés est prête ! Finalisez votre inscription",
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
