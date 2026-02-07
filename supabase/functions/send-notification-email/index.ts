// Deno.serve used below

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type NotificationType = 
  | "new_message" 
  | "quote_received" 
  | "quote_accepted" 
  | "quote_refused"
  | "artisan_approved"
  | "artisan_rejected";

interface NotificationEmailRequest {
  type: NotificationType;
  recipientEmail: string;
  recipientFirstName: string;
  senderName: string;
  // For quotes
  quoteDescription?: string;
  quoteAmount?: number;
  // For messages
  messagePreview?: string;
  // For artisan approval/rejection
  rejectionReason?: string;
}

const getEmailContent = (
  type: NotificationType,
  recipientFirstName: string,
  senderName: string,
  quoteDescription?: string,
  quoteAmount?: number,
  messagePreview?: string,
  rejectionReason?: string
): { subject: string; heading: string; message: string; ctaText: string; ctaUrl: string; icon: string; accentColor: string; tipMessage?: string } => {
  const baseUrl = "https://artisansvalides.fr";
  
  switch (type) {
    case "new_message":
      return {
        subject: `💬 Nouveau message de ${senderName}`,
        heading: "Vous avez un nouveau message !",
        message: `<strong>${senderName}</strong> vous a envoyé un message${messagePreview ? ` :<br><em style="color: #666; font-style: italic;">"${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}"</em>` : '.'}`,
        ctaText: "Voir le message",
        ctaUrl: `${baseUrl}/artisan/messagerie`,
        icon: "💬",
        accentColor: "#3B82F6",
      };
    
    case "quote_received":
      return {
        subject: `📋 Nouveau devis de ${senderName}`,
        heading: "Vous avez reçu un devis !",
        message: `<strong>${senderName}</strong> vous a envoyé un devis${quoteDescription ? ` pour :<br><strong>${quoteDescription}</strong>` : '.'}${quoteAmount ? `<br><br><span style="font-size: 24px; font-weight: bold; color: #182c44;">${quoteAmount.toLocaleString('fr-FR')} € TTC</span>` : ''}`,
        ctaText: "Voir le devis",
        ctaUrl: `${baseUrl}/client/devis`,
        icon: "📋",
        accentColor: "#D4AF37",
      };
    
    case "quote_accepted":
      return {
        subject: `✅ Devis accepté par ${senderName}`,
        heading: "Excellente nouvelle !",
        message: `<strong>${senderName}</strong> a accepté votre devis${quoteDescription ? ` pour :<br><strong>${quoteDescription}</strong>` : ' !'}${quoteAmount ? `<br><br><span style="font-size: 24px; font-weight: bold; color: #16A34A;">${quoteAmount.toLocaleString('fr-FR')} € TTC</span>` : ''}<br><br>Vous pouvez maintenant contacter votre client pour planifier l'intervention.`,
        ctaText: "Contacter le client",
        ctaUrl: `${baseUrl}/artisan/messagerie`,
        icon: "✅",
        accentColor: "#16A34A",
      };
    
    case "quote_refused":
      return {
        subject: `❌ Devis refusé par ${senderName}`,
        heading: "Devis non retenu",
        message: `<strong>${senderName}</strong> n'a pas retenu votre devis${quoteDescription ? ` pour :<br><strong>${quoteDescription}</strong>` : '.'}${quoteAmount ? `<br><span style="color: #666;">${quoteAmount.toLocaleString('fr-FR')} € TTC</span>` : ''}<br><br>Ne vous découragez pas ! D'autres opportunités vous attendent sur la plateforme.`,
        ctaText: "Voir les missions disponibles",
        ctaUrl: `${baseUrl}/artisan/missions`,
        icon: "📊",
        accentColor: "#EF4444",
      };

    case "artisan_approved":
      return {
        subject: `🎉 Félicitations ! Votre profil artisan a été validé`,
        heading: "Bienvenue parmi les Artisans Validés !",
        message: `<strong>Excellente nouvelle !</strong><br><br>Votre profil a été vérifié et approuvé par notre équipe. Vous êtes désormais un <strong style="color: #16A34A;">Artisan Validé</strong> sur notre plateforme !<br><br>✅ Votre profil est maintenant visible par tous les clients<br>✅ Vous pouvez recevoir des demandes de devis<br>✅ Vous avez accès à toutes les missions disponibles<br><br>Nous vous souhaitons beaucoup de succès !`,
        ctaText: "Accéder à mon dashboard",
        ctaUrl: `${baseUrl}/artisan/dashboard`,
        icon: "🏆",
        accentColor: "#16A34A",
        tipMessage: "Complétez votre profil à 100% pour maximiser votre visibilité auprès des clients !",
      };

    case "artisan_rejected":
      return {
        subject: `⚠️ Votre demande de validation nécessite des corrections`,
        heading: "Des corrections sont nécessaires",
        message: `Nous avons examiné votre dossier et certains éléments nécessitent des modifications avant de pouvoir valider votre profil.<br><br><strong>Raison du refus :</strong><br><div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px 16px; margin: 12px 0; border-radius: 4px;"><em>${rejectionReason || "Veuillez vérifier vos documents et informations."}</em></div><br>Pas d'inquiétude ! Vous pouvez corriger ces éléments et soumettre à nouveau votre dossier.`,
        ctaText: "Modifier mon dossier",
        ctaUrl: `${baseUrl}/artisan/documents`,
        icon: "📝",
        accentColor: "#F59E0B",
        tipMessage: "Besoin d'aide ? Contactez notre équipe support qui vous guidera dans les corrections à apporter.",
      };
    
    default:
      return {
        subject: "Notification - Artisans Validés",
        heading: "Nouvelle notification",
        message: "Vous avez une nouvelle notification sur Artisans Validés.",
        ctaText: "Voir sur la plateforme",
        ctaUrl: baseUrl,
        icon: "🔔",
        accentColor: "#D4AF37",
      };
  }
};

const getEmailTemplate = (
  recipientFirstName: string,
  content: ReturnType<typeof getEmailContent>
) => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Header with Navy background -->
          <tr>
            <td style="background: linear-gradient(135deg, #182c44 0%, #1e3a5f 100%); padding: 32px 40px; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-flex; align-items: center; gap: 12px;">
                      <div style="background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                        <span style="color: #182c44; font-weight: bold; font-size: 16px;">AV</span>
                      </div>
                      <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Artisans Validés</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Icon Badge -->
          <tr>
            <td style="padding: 30px 40px 0 40px; text-align: center;">
              <div style="display: inline-block; width: 70px; height: 70px; background-color: ${content.accentColor}15; border-radius: 50%; line-height: 70px; font-size: 32px;">
                ${content.icon}
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 24px 40px 20px 40px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #182c44;">
                Bonjour ${recipientFirstName} !
              </h1>
              <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: ${content.accentColor};">
                ${content.heading}
              </h2>
              <p style="margin: 0; font-size: 16px; color: #444444; line-height: 1.6;">
                ${content.message}
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 20px 40px 30px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td>
                    <a href="${content.ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); color: #182c44; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 16px rgba(212, 175, 55, 0.35);">
                      ${content.ctaText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tip Box -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; border-radius: 10px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 13px; color: #666666; text-align: center;">
                      💡 <strong>Astuce :</strong> ${content.tipMessage || "Répondez rapidement pour maximiser vos chances de succès !"}
                    </p>
                  </td>
                </tr>
              </table>
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
            <td style="padding: 24px 40px; text-align: center; background-color: #fafafa;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #182c44; font-weight: 600;">
                Artisans Validés
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #999999;">
                La plateforme de confiance pour trouver les meilleurs artisans
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 6px;">
                    <a href="https://artisansvalides.fr" style="font-size: 11px; color: #D4AF37; text-decoration: none;">Site web</a>
                  </td>
                  <td style="color: #dddddd; font-size: 11px;">|</td>
                  <td style="padding: 0 6px;">
                    <a href="https://artisansvalides.fr/contact" style="font-size: 11px; color: #D4AF37; text-decoration: none;">Contact</a>
                  </td>
                  <td style="color: #dddddd; font-size: 11px;">|</td>
                  <td style="padding: 0 6px;">
                    <a href="https://artisansvalides.fr/client/parametres" style="font-size: 11px; color: #D4AF37; text-decoration: none;">Gérer mes emails</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 12px 0 0 0; font-size: 10px; color: #cccccc;">
                © ${new Date().getFullYear()} Artisans Validés - Tous droits réservés
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      recipientEmail, 
      recipientFirstName, 
      senderName,
      quoteDescription,
      quoteAmount,
      messagePreview,
      rejectionReason
    }: NotificationEmailRequest = await req.json();

    console.log("Sending notification email:", { type, recipientEmail, senderName });

    const content = getEmailContent(
      type, 
      recipientFirstName, 
      senderName, 
      quoteDescription, 
      quoteAmount, 
      messagePreview,
      rejectionReason
    );
    
    const html = getEmailTemplate(recipientFirstName, content);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Artisans Validés <noreply@artisansvalides.fr>",
        to: [recipientEmail],
        subject: content.subject,
        html,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
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
