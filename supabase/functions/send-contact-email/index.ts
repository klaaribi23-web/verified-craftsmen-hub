import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Simple validation function
function validateInput(data: any): { valid: boolean; error?: string; data?: ContactEmailRequest } {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return { valid: false, error: "Le nom est requis" };
  }
  if (data.name.length > 100) {
    return { valid: false, error: "Le nom ne peut pas dépasser 100 caractères" };
  }
  
  if (!data.email || typeof data.email !== 'string') {
    return { valid: false, error: "L'email est requis" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) {
    return { valid: false, error: "Adresse email invalide" };
  }
  if (data.email.length > 255) {
    return { valid: false, error: "L'email ne peut pas dépasser 255 caractères" };
  }
  
  if (!data.subject || typeof data.subject !== 'string' || data.subject.trim().length === 0) {
    return { valid: false, error: "Le sujet est requis" };
  }
  if (data.subject.length > 200) {
    return { valid: false, error: "Le sujet ne peut pas dépasser 200 caractères" };
  }
  
  if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
    return { valid: false, error: "Le message est requis" };
  }
  if (data.message.length > 5000) {
    return { valid: false, error: "Le message ne peut pas dépasser 5000 caractères" };
  }

  return {
    valid: true,
    data: {
      name: data.name.trim(),
      email: data.email.trim(),
      subject: data.subject.trim(),
      message: data.message.trim(),
    }
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Configuration error");
    }

    const body = await req.json();
    console.log("Received contact form submission");

    // Validate input
    const validation = validateInput(body);
    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { name, email, subject, message } = validation.data!;
    const escapedName = escapeHtml(name);
    const escapedEmail = escapeHtml(email);
    const escapedSubject = escapeHtml(subject);
    const escapedMessage = escapeHtml(message);

    // Email to team
    const teamEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); padding: 30px 40px; text-align: center;">
                    <img src="https://artisansvalides.fr/logo.png" alt="Artisans Validés" style="height: 50px; margin-bottom: 15px;" />
                    <h1 style="color: #d4af37; margin: 0; font-size: 24px; font-weight: 600;">Nouveau message de contact</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 15px 0; color: #1e3a5f; font-size: 14px;"><strong>De :</strong> ${escapedName}</p>
                          <p style="margin: 0 0 15px 0; color: #1e3a5f; font-size: 14px;"><strong>Email :</strong> <a href="mailto:${escapedEmail}" style="color: #d4af37;">${escapedEmail}</a></p>
                          <p style="margin: 0; color: #1e3a5f; font-size: 14px;"><strong>Sujet :</strong> ${escapedSubject}</p>
                        </td>
                      </tr>
                    </table>
                    
                    <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 15px 0;">Message :</h2>
                    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; color: #374151; line-height: 1.6;">
                      ${escapedMessage.replace(/\n/g, '<br>')}
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="mailto:${escapedEmail}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #c9a227 100%); color: #1e3a5f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                        Répondre à ${escapedName}
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #1e3a5f; padding: 25px; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Ce message a été envoyé depuis le formulaire de contact du site Artisans Validés
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

    // Confirmation email to sender
    const messagePreview = message.length > 200 ? message.substring(0, 200) + '...' : message;
    const confirmationEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); padding: 30px 40px; text-align: center;">
                    <img src="https://artisansvalides.fr/logo.png" alt="Artisans Validés" style="height: 50px; margin-bottom: 15px;" />
                    <h1 style="color: #d4af37; margin: 0; font-size: 24px; font-weight: 600;">Message bien reçu !</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Bonjour <strong>${escapedName}</strong>,
                    </p>
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Nous avons bien reçu votre message et vous remercions de nous avoir contacté. Notre équipe vous répondra dans les plus brefs délais, généralement sous 24 heures ouvrées.
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                      <tr>
                        <td>
                          <p style="margin: 0 0 10px 0; color: #1e3a5f; font-size: 14px;"><strong>Votre sujet :</strong> ${escapedSubject}</p>
                          <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Votre message :</strong></p>
                          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px; font-style: italic;">"${escapeHtml(messagePreview)}"</p>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      En attendant, n'hésitez pas à parcourir notre plateforme pour découvrir nos artisans qualifiés.
                    </p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="https://artisansvalides.fr/trouver-artisan" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #c9a227 100%); color: #1e3a5f; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                        Découvrir nos artisans
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #1e3a5f; padding: 25px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; font-weight: 600;">
                      Artisans Validés
                    </p>
                    <p style="margin: 0 0 5px 0; color: #9ca3af; font-size: 12px;">
                      77 rue de la Monnaie, 59800 Lille
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      <a href="tel:+33353632999" style="color: #d4af37; text-decoration: none;">03 53 63 29 99</a> | 
                      <a href="mailto:contact@artisansvalides.fr" style="color: #d4af37; text-decoration: none;">contact@artisansvalides.fr</a>
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

    // Send email to team
    console.log("Sending email to team...");
    const teamEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Artisans Validés <noreply@artisansvalides.fr>",
        to: ["contact@artisansvalides.fr"],
        subject: `[Contact] ${subject} - de ${name}`,
        html: teamEmailHtml,
        reply_to: email,
      }),
    });

    if (!teamEmailResponse.ok) {
      const error = await teamEmailResponse.text();
      console.error("Failed to send team email:", error);
      throw new Error("Erreur lors de l'envoi du message");
    }

    const teamEmailData = await teamEmailResponse.json();
    console.log("Team email sent successfully:", teamEmailData.id);

    // Send confirmation email to sender
    console.log("Sending confirmation email to sender...");
    const confirmationResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Artisans Validés <noreply@artisansvalides.fr>",
        to: [email],
        subject: "Nous avons bien reçu votre message - Artisans Validés",
        html: confirmationEmailHtml,
      }),
    });

    if (!confirmationResponse.ok) {
      const error = await confirmationResponse.text();
      console.error("Failed to send confirmation email:", error);
      // Don't throw here, the main message was sent successfully
    } else {
      const confirmationData = await confirmationResponse.json();
      console.log("Confirmation email sent successfully:", confirmationData.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Message envoyé avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur lors de l'envoi du message" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
