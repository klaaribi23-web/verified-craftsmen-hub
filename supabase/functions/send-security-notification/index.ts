import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type NotificationType = "new_device_login" | "password_changed" | "email_changed";

interface SecurityNotificationRequest {
  userId: string;
  type: NotificationType;
  deviceInfo?: {
    fingerprint: string;
    browser?: string;
    os?: string;
    ipAddress?: string;
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEmailContent(
  type: NotificationType,
  firstName: string,
  deviceInfo?: { browser?: string; os?: string; ipAddress?: string }
): { subject: string; html: string } {
  const date = formatDate(new Date());
  
  switch (type) {
    case "new_device_login":
      return {
        subject: "🔔 Nouvelle connexion détectée - Artisans Validés",
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 60px; height: 60px; background: #fef3c7; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 30px;">🔔</span>
                    </div>
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Nouvelle connexion détectée</h1>
                  </div>
                  
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Bonjour${firstName ? ` ${firstName}` : ''}, 
                  </p>
                  
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Une nouvelle connexion à votre compte Artisans Validés a été effectuée :
                  </p>
                  
                  <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">📅 Date et heure</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; text-align: right; font-weight: 500;">${date}</td>
                      </tr>
                      ${deviceInfo?.browser ? `
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🌐 Navigateur</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; text-align: right; font-weight: 500;">${deviceInfo.browser}</td>
                      </tr>
                      ` : ''}
                      ${deviceInfo?.os ? `
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">💻 Système</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; text-align: right; font-weight: 500;">${deviceInfo.os}</td>
                      </tr>
                      ` : ''}
                      ${deviceInfo?.ipAddress ? `
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">🌍 Adresse IP</td>
                        <td style="padding: 8px 0; color: #0f172a; font-size: 14px; text-align: right; font-weight: 500;">${deviceInfo.ipAddress}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>
                  
                  <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <p style="color: #991b1b; font-size: 14px; margin: 0;">
                      <strong>⚠️ Ce n'était pas vous ?</strong><br>
                      Changez immédiatement votre mot de passe depuis votre tableau de bord ou contactez notre support.
                    </p>
                  </div>
                </div>
                
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
                  © ${new Date().getFullYear()} Artisans Validés - Cet email est envoyé automatiquement pour votre sécurité
                </p>
              </div>
            </body>
          </html>
        `,
      };

    case "password_changed":
      return {
        subject: "🔒 Mot de passe modifié - Artisans Validés",
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 60px; height: 60px; background: #dcfce7; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 30px;">🔒</span>
                    </div>
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Mot de passe modifié</h1>
                  </div>
                  
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Bonjour${firstName ? ` ${firstName}` : ''},
                  </p>
                  
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Le mot de passe de votre compte Artisans Validés a été modifié avec succès le <strong>${date}</strong>.
                  </p>
                  
                  <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <p style="color: #166534; font-size: 14px; margin: 0;">
                      ✅ Votre compte est maintenant sécurisé avec votre nouveau mot de passe.
                    </p>
                  </div>
                  
                  <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <p style="color: #991b1b; font-size: 14px; margin: 0;">
                      <strong>⚠️ Ce n'était pas vous ?</strong><br>
                      Contactez immédiatement notre support pour sécuriser votre compte.
                    </p>
                  </div>
                </div>
                
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
                  © ${new Date().getFullYear()} Artisans Validés - Cet email est envoyé automatiquement pour votre sécurité
                </p>
              </div>
            </body>
          </html>
        `,
      };

    case "email_changed":
      return {
        subject: "📧 Email modifié - Artisans Validés",
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 60px; height: 60px; background: #dbeafe; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 30px;">📧</span>
                    </div>
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Adresse email modifiée</h1>
                  </div>
                  
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Bonjour${firstName ? ` ${firstName}` : ''},
                  </p>
                  
                  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    L'adresse email de votre compte Artisans Validés a été modifiée le <strong>${date}</strong>.
                  </p>
                  
                  <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                    <p style="color: #991b1b; font-size: 14px; margin: 0;">
                      <strong>⚠️ Ce n'était pas vous ?</strong><br>
                      Contactez immédiatement notre support pour récupérer l'accès à votre compte.
                    </p>
                  </div>
                </div>
                
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
                  © ${new Date().getFullYear()} Artisans Validés - Cet email est envoyé automatiquement pour votre sécurité
                </p>
              </div>
            </body>
          </html>
        `,
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, deviceInfo }: SecurityNotificationRequest = await req.json();

    console.log("Sending security notification:", type, "for user:", userId);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user info
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      throw new Error("Utilisateur introuvable");
    }

    const email = userData.user.email;
    const firstName = userData.user.user_metadata?.first_name || "";

    if (!email) {
      throw new Error("Email utilisateur non trouvé");
    }

    // If new device login, check/register device
    if (type === "new_device_login" && deviceInfo) {
      // Check if device already exists
      const { data: existingDevice } = await supabaseAdmin
        .from("user_devices")
        .select("*")
        .eq("user_id", userId)
        .eq("device_fingerprint", deviceInfo.fingerprint)
        .single();

      if (existingDevice) {
        // Device already known, just update last login
        await supabaseAdmin
          .from("user_devices")
          .update({ 
            last_login_at: new Date().toISOString(),
            ip_address: deviceInfo.ipAddress 
          })
          .eq("id", existingDevice.id);

        console.log("Known device, skipping notification");
        return new Response(
          JSON.stringify({ success: true, message: "Appareil connu, pas de notification" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // New device - register it
      await supabaseAdmin
        .from("user_devices")
        .insert({
          user_id: userId,
          device_fingerprint: deviceInfo.fingerprint,
          device_name: `${deviceInfo.browser || 'Unknown'} on ${deviceInfo.os || 'Unknown'}`,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          ip_address: deviceInfo.ipAddress,
        });
    }

    // Get email content
    const { subject, html } = getEmailContent(type, firstName, deviceInfo);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Artisans Validés <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Security notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Notification envoyée" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-security-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);