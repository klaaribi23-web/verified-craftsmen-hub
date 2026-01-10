import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SubscriptionNotificationType =
  | "subscription_started"
  | "subscription_upgraded"
  | "subscription_downgraded"
  | "subscription_canceled";

interface PlanDetails {
  previousTier?: string;
  newTier: string;
  planName: string;
  previousPlanName?: string;
  price?: string;
  interval?: string;
  subscriptionEnd?: string;
}

interface SubscriptionNotificationRequest {
  userId: string;
  type: SubscriptionNotificationType;
  planDetails: PlanDetails;
}

const PLAN_NAMES: Record<string, string> = {
  free: "Gratuit",
  essential: "Essentiel",
  pro: "Pro",
  elite: "Elite",
};

const PLAN_FEATURES: Record<string, string[]> = {
  essential: [
    "Jusqu'à 30 candidatures missions/mois",
    "Jusqu'à 5 services",
    "Accès aux Stories Live",
    "Badge Bronze visible",
  ],
  pro: [
    "Candidatures missions illimitées",
    "Services illimités",
    "Accès aux Stories Live",
    "Accès aux Offres Partenaires",
    "Badge Argent visible",
    "Priorité dans les recherches",
  ],
  elite: [
    "Candidatures missions illimitées",
    "Services illimités",
    "Accès aux Stories Live",
    "Accès aux Offres Partenaires",
    "Badge Or visible",
    "Top priorité dans les recherches",
    "Support prioritaire",
  ],
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getEmailContent = (
  type: SubscriptionNotificationType,
  firstName: string,
  planDetails: PlanDetails
): { subject: string; html: string } => {
  const { newTier, previousTier, planName, previousPlanName, price, interval, subscriptionEnd } = planDetails;
  const features = PLAN_FEATURES[newTier] || [];
  const intervalText = interval === "yearly" ? "an" : "mois";

  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; padding: 30px 20px; border-radius: 12px 12px 0 0; }
      .content { background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .feature-list { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .feature-item { padding: 8px 0; display: flex; align-items: center; }
      .check-icon { color: #10b981; margin-right: 10px; font-weight: bold; }
      .cta-button { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
      .plan-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; }
      .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
      .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
  `;

  switch (type) {
    case "subscription_started":
      return {
        subject: `🎉 Bienvenue dans ${planName} !`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
                <h1 style="margin: 0; font-size: 28px;">✅ Félicitations ${firstName} !</h1>
                <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Votre abonnement ${planName} est maintenant actif</p>
              </div>
              <div class="content">
                <p>Merci d'avoir choisi de faire confiance à notre plateforme pour développer votre activité d'artisan.</p>
                
                <div style="text-align: center; margin: 25px 0;">
                  <span class="plan-badge" style="background: #10b981; color: white;">
                    Plan ${planName}${price ? ` - ${price}€/${intervalText}` : ""}
                  </span>
                </div>

                <div class="feature-list">
                  <h3 style="margin-top: 0; color: #1f2937;">Vos avantages :</h3>
                  ${features.map(f => `<div class="feature-item"><span class="check-icon">✓</span>${f}</div>`).join("")}
                </div>

                ${subscriptionEnd ? `
                <div class="info-box">
                  <strong>📅 Prochain renouvellement :</strong> ${formatDate(subscriptionEnd)}
                </div>
                ` : ""}

                <div style="text-align: center;">
                  <a href="https://artisansvalides.fr/artisan/dashboard" class="cta-button" style="background: #10b981; color: white;">
                    Accéder à mon tableau de bord
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Cet email a été envoyé automatiquement suite à votre souscription.</p>
                <p>© ${new Date().getFullYear()} Vitrine Artisan - Tous droits réservés</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "subscription_upgraded":
      return {
        subject: `⬆️ Votre abonnement a été upgradé vers ${planName} !`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white;">
                <h1 style="margin: 0; font-size: 28px;">⬆️ Upgrade réussi !</h1>
                <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Vous êtes passé de ${previousPlanName || PLAN_NAMES[previousTier || "free"]} à ${planName}</p>
              </div>
              <div class="content">
                <p>Bonjour ${firstName},</p>
                <p>Excellente décision ! Votre abonnement a été mis à niveau vers <strong>${planName}</strong>. Vous avez maintenant accès à encore plus de fonctionnalités pour développer votre activité.</p>
                
                <div style="text-align: center; margin: 25px 0;">
                  <span class="plan-badge" style="background: #3b82f6; color: white;">
                    Plan ${planName}${price ? ` - ${price}€/${intervalText}` : ""}
                  </span>
                </div>

                <div class="feature-list">
                  <h3 style="margin-top: 0; color: #1f2937;">Vos nouveaux avantages :</h3>
                  ${features.map(f => `<div class="feature-item"><span class="check-icon">✓</span>${f}</div>`).join("")}
                </div>

                ${subscriptionEnd ? `
                <div class="info-box">
                  <strong>📅 Prochain renouvellement :</strong> ${formatDate(subscriptionEnd)}
                </div>
                ` : ""}

                <div style="text-align: center;">
                  <a href="https://artisansvalides.fr/artisan/dashboard" class="cta-button" style="background: #3b82f6; color: white;">
                    Découvrir mes nouvelles fonctionnalités
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Cet email a été envoyé automatiquement suite à la modification de votre abonnement.</p>
                <p>© ${new Date().getFullYear()} Vitrine Artisan - Tous droits réservés</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "subscription_downgraded":
      return {
        subject: `📋 Votre abonnement a été modifié`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                <h1 style="margin: 0; font-size: 28px;">📋 Abonnement modifié</h1>
                <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Vous êtes passé de ${previousPlanName || PLAN_NAMES[previousTier || "free"]} à ${planName}</p>
              </div>
              <div class="content">
                <p>Bonjour ${firstName},</p>
                <p>Nous confirmons que votre abonnement a été modifié vers le plan <strong>${planName}</strong>.</p>
                
                <div style="text-align: center; margin: 25px 0;">
                  <span class="plan-badge" style="background: #f59e0b; color: white;">
                    Plan ${planName}${price ? ` - ${price}€/${intervalText}` : ""}
                  </span>
                </div>

                ${features.length > 0 ? `
                <div class="feature-list">
                  <h3 style="margin-top: 0; color: #1f2937;">Vos avantages actuels :</h3>
                  ${features.map(f => `<div class="feature-item"><span class="check-icon">✓</span>${f}</div>`).join("")}
                </div>
                ` : ""}

                ${subscriptionEnd ? `
                <div class="info-box">
                  <strong>📅 Prochain renouvellement :</strong> ${formatDate(subscriptionEnd)}
                </div>
                ` : ""}

                <p style="margin-top: 20px;">Si vous souhaitez à nouveau accéder à toutes les fonctionnalités premium, vous pouvez upgrader votre abonnement à tout moment.</p>

                <div style="text-align: center;">
                  <a href="https://artisansvalides.fr/artisan/abonnement" class="cta-button" style="background: #f59e0b; color: white;">
                    Voir les plans disponibles
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>Cet email a été envoyé automatiquement suite à la modification de votre abonnement.</p>
                <p>© ${new Date().getFullYear()} Vitrine Artisan - Tous droits réservés</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "subscription_canceled":
      return {
        subject: `❌ Votre abonnement a été annulé`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
                <h1 style="margin: 0; font-size: 28px;">❌ Abonnement annulé</h1>
                <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Nous sommes tristes de vous voir partir</p>
              </div>
              <div class="content">
                <p>Bonjour ${firstName},</p>
                <p>Nous confirmons l'annulation de votre abonnement <strong>${previousPlanName || PLAN_NAMES[previousTier || "essential"]}</strong>. Votre compte est maintenant sur le plan Gratuit.</p>
                
                <div class="info-box" style="background: #fef2f2; border-left-color: #ef4444;">
                  <strong>⚠️ Fonctionnalités désactivées :</strong>
                  <ul style="margin: 10px 0 0; padding-left: 20px;">
                    <li>Candidatures missions limitées à 1/mois</li>
                    <li>Services limités à 3</li>
                    <li>Stories Live désactivées</li>
                    <li>Badge de confiance retiré</li>
                    <li>Priorité dans les recherches perdue</li>
                  </ul>
                </div>

                <p>Vous pouvez réactiver votre abonnement à tout moment pour retrouver tous vos avantages premium.</p>

                <div style="text-align: center;">
                  <a href="https://artisansvalides.fr/artisan/abonnement" class="cta-button" style="background: #10b981; color: white;">
                    Réactiver mon abonnement
                  </a>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Une question ? Un problème ? N'hésitez pas à nous contacter, nous sommes là pour vous aider.
                </p>
              </div>
              <div class="footer">
                <p>Cet email a été envoyé automatiquement suite à l'annulation de votre abonnement.</p>
                <p>© ${new Date().getFullYear()} Vitrine Artisan - Tous droits réservés</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: "Notification d'abonnement",
        html: "<p>Votre abonnement a été modifié.</p>",
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, planDetails }: SubscriptionNotificationRequest = await req.json();

    console.log("[SUBSCRIPTION-NOTIFICATION] Processing:", { userId, type, planDetails });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user data
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      console.error("[SUBSCRIPTION-NOTIFICATION] Error fetching user:", userError);
      throw new Error("User not found");
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      throw new Error("User email not found");
    }

    // Get user profile for first name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("first_name")
      .eq("user_id", userId)
      .single();

    const firstName = profile?.first_name || "Artisan";

    // Get email content
    const { subject, html } = getEmailContent(type, firstName, planDetails);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Vitrine Artisan <notifications@resend.dev>",
      to: [userEmail],
      subject,
      html,
    });

    console.log("[SUBSCRIPTION-NOTIFICATION] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("[SUBSCRIPTION-NOTIFICATION] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
