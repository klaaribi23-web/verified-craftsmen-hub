import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityAlertRequest {
  email: string;
  type: "multiple_failed_logins" | "suspicious_activity" | "account_locked";
  details?: Record<string, unknown>;
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

function getAlertContent(
  type: SecurityAlertRequest["type"],
  details?: Record<string, unknown>
): { subject: string; html: string } {
  const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #ffffff;
  `;

  const alertBanner = `
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  `;

  switch (type) {
    case "multiple_failed_logins":
      return {
        subject: "⚠️ Alerte sécurité - Tentatives de connexion échouées",
        html: `
          <div style="${baseStyles}">
            <div style="${alertBanner}">
              <h1 style="margin: 0; font-size: 24px;">⚠️ Alerte Sécurité</h1>
            </div>
            <div style="padding: 30px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0 0 8px 8px;">
              <h2 style="color: #991b1b; margin-top: 0;">Plusieurs tentatives de connexion échouées détectées</h2>
              <p style="color: #7f1d1d; font-size: 16px; line-height: 1.6;">
                Nous avons détecté <strong>${details?.attempt_count || "plusieurs"} tentatives de connexion échouées</strong> 
                sur votre compte.
              </p>
              ${details?.ip_address ? `
                <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #374151;">
                    <strong>Adresse IP :</strong> ${details.ip_address}
                  </p>
                  <p style="margin: 10px 0 0 0; color: #374151;">
                    <strong>Date :</strong> ${formatDate(new Date())}
                  </p>
                </div>
              ` : ""}
              <h3 style="color: #991b1b;">Que faire ?</h3>
              <ul style="color: #7f1d1d; line-height: 1.8;">
                <li>Si c'était vous, ignorez ce message</li>
                <li>Si ce n'était pas vous, changez immédiatement votre mot de passe</li>
                <li>Activez l'authentification à deux facteurs si disponible</li>
                <li>Vérifiez les appareils connectés à votre compte</li>
              </ul>
              <div style="margin-top: 30px; padding: 20px; background: #fef3cd; border-radius: 8px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Note :</strong> Par mesure de sécurité, les connexions depuis cette adresse IP 
                  sont temporairement bloquées pendant 15 minutes.
                </p>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
              <p>Cet email a été envoyé automatiquement par le système de sécurité de Craft Link.</p>
              <p>Ne répondez pas à cet email.</p>
            </div>
          </div>
        `,
      };

    case "suspicious_activity":
      return {
        subject: "🔒 Activité suspecte détectée sur votre compte",
        html: `
          <div style="${baseStyles}">
            <div style="${alertBanner}">
              <h1 style="margin: 0; font-size: 24px;">🔒 Activité Suspecte</h1>
            </div>
            <div style="padding: 30px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0 0 8px 8px;">
              <h2 style="color: #991b1b; margin-top: 0;">Une activité inhabituelle a été détectée</h2>
              <p style="color: #7f1d1d; font-size: 16px; line-height: 1.6;">
                Notre système a détecté une activité suspecte sur votre compte.
              </p>
              <p style="color: #7f1d1d;">
                Si vous n'êtes pas à l'origine de cette activité, veuillez immédiatement :
              </p>
              <ol style="color: #7f1d1d; line-height: 1.8;">
                <li>Changer votre mot de passe</li>
                <li>Vérifier vos informations de compte</li>
                <li>Nous contacter si nécessaire</li>
              </ol>
            </div>
          </div>
        `,
      };

    case "account_locked":
      return {
        subject: "🔐 Votre compte a été temporairement verrouillé",
        html: `
          <div style="${baseStyles}">
            <div style="${alertBanner}">
              <h1 style="margin: 0; font-size: 24px;">🔐 Compte Verrouillé</h1>
            </div>
            <div style="padding: 30px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0 0 8px 8px;">
              <h2 style="color: #991b1b; margin-top: 0;">Votre compte a été temporairement verrouillé</h2>
              <p style="color: #7f1d1d; font-size: 16px; line-height: 1.6;">
                Suite à plusieurs tentatives de connexion échouées, votre compte a été 
                temporairement verrouillé pour des raisons de sécurité.
              </p>
              <p style="color: #7f1d1d;">
                Le verrouillage sera automatiquement levé dans 30 minutes.
              </p>
            </div>
          </div>
        `,
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, details }: SecurityAlertRequest = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: "Email and type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, html } = getAlertContent(type, details);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Craft Link Sécurité <security@craftlink.fr>",
        to: [email],
        subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to send security alert" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the alert
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabase.from("security_logs").insert({
      action: `security_alert_sent_${type}`,
      details: { email, type, ...details },
      severity: "info",
    });

    console.log(`Security alert sent to ${email} for ${type}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-security-alert:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
