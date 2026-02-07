// Deno.serve used below

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  firstName: string;
  lastName?: string;
  userType: "client" | "artisan";
  confirmationUrl: string;
}

const getEmailTemplate = (
  firstName: string,
  userType: "client" | "artisan",
  confirmationUrl: string
) => {
  const isArtisan = userType === "artisan";
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre email - Artisans Validés</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Header with Navy background -->
          <tr>
            <td style="background: linear-gradient(135deg, #182c44 0%, #1e3a5f 100%); padding: 40px 40px 30px 40px; text-align: center;">
              <!-- Logo -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-flex; align-items: center; gap: 12px;">
                      <div style="background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: #182c44; font-weight: bold; font-size: 20px;">AV</span>
                      </div>
                      <span style="color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Artisans Validés</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #182c44;">
                Bienvenue ${firstName} ! 👋
              </h1>
              <p style="margin: 0; font-size: 16px; color: #666666; line-height: 1.6;">
                ${isArtisan 
                  ? "Merci de rejoindre notre réseau d'artisans de confiance. Vous êtes à un clic de développer votre activité !"
                  : "Merci de rejoindre Artisans Validés. Vous êtes à un clic de trouver les meilleurs artisans de votre région !"
                }
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 10px 40px 30px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td>
                    <a href="${confirmationUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); color: #182c44; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 16px rgba(212, 175, 55, 0.4);">
                      Confirmer mon email
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Info Box -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; border-radius: 12px; border-left: 4px solid #D4AF37;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #182c44;">
                      ${isArtisan ? "🔧 Prochaines étapes" : "✨ Ce qui vous attend"}
                    </p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666666; line-height: 1.8;">
                      ${isArtisan ? `
                        <li>Complétez votre profil professionnel</li>
                        <li>Ajoutez vos réalisations en photos</li>
                        <li>Recevez des demandes de devis qualifiées</li>
                        <li>Développez votre réputation en ligne</li>
                      ` : `
                        <li>Parcourez les artisans de votre région</li>
                        <li>Consultez les avis clients vérifiés</li>
                        <li>Demandez des devis gratuits</li>
                        <li>Communiquez directement avec les pros</li>
                      `}
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.6;">
                🔒 Si vous n'avez pas créé de compte sur Artisans Validés, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #fafafa;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #182c44; font-weight: 600;">
                Artisans Validés
              </p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #999999;">
                La plateforme de confiance pour trouver les meilleurs artisans
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://artisansvalides.fr" style="font-size: 12px; color: #D4AF37; text-decoration: none;">Site web</a>
                  </td>
                  <td style="color: #dddddd;">|</td>
                  <td style="padding: 0 8px;">
                    <a href="https://artisansvalides.fr/contact" style="font-size: 12px; color: #D4AF37; text-decoration: none;">Contact</a>
                  </td>
                  <td style="color: #dddddd;">|</td>
                  <td style="padding: 0 8px;">
                    <a href="https://artisansvalides.fr/cgu" style="font-size: 12px; color: #D4AF37; text-decoration: none;">CGU</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #cccccc;">
                © ${new Date().getFullYear()} Artisans Validés - Tous droits réservés
              </p>
            </td>
          </tr>

        </table>

        <!-- Alternative link -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
          <tr>
            <td style="text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #666666; word-break: break-all;">
                ${confirmationUrl}
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
    const { email, firstName, lastName, userType, confirmationUrl }: ConfirmationEmailRequest = await req.json();

    console.log("Sending confirmation email to:", email, "type:", userType);

    const html = getEmailTemplate(firstName, userType, confirmationUrl);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Artisans Validés <noreply@artisansvalides.fr>",
        to: [email],
        subject: `${firstName}, confirmez votre email - Artisans Validés`,
        html,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
