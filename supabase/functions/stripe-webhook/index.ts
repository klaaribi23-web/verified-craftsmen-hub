import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

async function getArtisanByStripeCustomerId(stripeCustomerId: string) {
  const { data, error } = await supabaseAdmin
    .from("artisans")
    .select("id, business_name, email, user_id, subscription_tier, subscription_status")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  if (error) {
    logStep("Error finding artisan", { error: error.message });
    return null;
  }
  return data;
}

async function updateArtisan(artisanId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from("artisans")
    .update(updates)
    .eq("id", artisanId);
  if (error) logStep("Error updating artisan", { error: error.message });
}

async function logEvent(
  artisanId: string | null,
  eventType: string,
  stripeEventId: string,
  status: string,
  amount?: number | null,
  metadata?: Record<string, unknown>
) {
  const { error } = await supabaseAdmin.from("subscription_events").insert({
    artisan_id: artisanId,
    event_type: eventType,
    stripe_event_id: stripeEventId,
    status,
    amount: amount ?? null,
    metadata: metadata ?? null,
  });
  if (error) logStep("Error logging event", { error: error.message });
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Artisans Validés <noreply@artisansvalides.fr>",
        to: [to],
        subject,
        html,
      }),
    });
    logStep("Email sent", { to, subject });
  } catch (err) {
    logStep("Email send error", { error: String(err) });
  }
}

function wrapEmail(heading: string, body: string, ctaUrl?: string, ctaText?: string) {
  const ctaBlock = ctaUrl && ctaText
    ? `<p style="text-align:center;margin:24px 0"><a href="${ctaUrl}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#D4AF37,#F4D03F);color:#182c44;font-weight:700;text-decoration:none;border-radius:10px">${ctaText}</a></p>`
    : "";
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:20px;font-family:sans-serif;background:#f5f5f5"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)"><div style="background:linear-gradient(135deg,#182c44,#1e3a5f);padding:24px 40px;text-align:center"><span style="color:#fff;font-size:20px;font-weight:700">Artisans Validés</span></div><div style="padding:32px 40px"><h2 style="color:#182c44;margin:0 0 16px">${heading}</h2><div style="color:#444;line-height:1.6">${body}</div>${ctaBlock}</div><div style="padding:16px 40px;background:#fafafa;text-align:center;font-size:11px;color:#999">© ${new Date().getFullYear()} Artisans Validés</div></div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    logStep("Missing secrets");
    return new Response("Server configuration error", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logStep("Missing stripe-signature header");
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    logStep("Signature verification failed", { error: String(err) });
    return new Response("Invalid signature", { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        const artisan = await getArtisanByStripeCustomerId(customerId);

        if (!artisan) {
          logStep("No artisan found for customer", { customerId });
          break;
        }

        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const isCanceled = subscription.cancel_at_period_end;

        const subscriptionEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        await updateArtisan(artisan.id, {
          subscription_tier: isActive ? "artisan_valide" : "free",
          subscription_status: isCanceled ? "cancelled" : (isActive ? "active" : "inactive"),
          subscription_end: subscriptionEnd,
          stripe_customer_id: customerId,
        });

        await logEvent(artisan.id, event.type, event.id, subscription.status, null, {
          subscription_id: subscription.id,
          cancel_at_period_end: isCanceled,
        });

        // Send confirmation email on creation
        if (event.type === "customer.subscription.created" && artisan.email) {
          await sendEmail(
            artisan.email,
            "🎉 Bienvenue parmi les Artisans Validés !",
            wrapEmail(
              "Votre abonnement est activé !",
              `<p>Félicitations <strong>${artisan.business_name}</strong> ! Votre abonnement Artisan Validé est désormais actif.</p><p>Vous bénéficiez maintenant de tous les avantages premium de la plateforme.</p>`,
              "https://artisansvalides.fr/artisan/dashboard",
              "Accéder à mon dashboard"
            )
          );
        }

        logStep("Subscription updated", { artisanId: artisan.id, status: subscription.status });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        const artisan = await getArtisanByStripeCustomerId(customerId);

        if (!artisan) break;

        await updateArtisan(artisan.id, {
          subscription_tier: "free",
          subscription_status: "cancelled",
          subscription_end: new Date().toISOString(),
        });

        await logEvent(artisan.id, event.type, event.id, "cancelled");

        if (artisan.email) {
          await sendEmail(
            artisan.email,
            "⚠️ Votre abonnement Artisan Validé a été résilié",
            wrapEmail(
              "Abonnement résilié",
              `<p>Votre abonnement a été résilié. Votre profil ne sera plus visible dans les résultats de recherche.</p><p>Vous pouvez vous réabonner à tout moment pour retrouver votre visibilité.</p>`,
              "https://artisansvalides.fr/artisan/abonnement",
              "Se réabonner"
            )
          );
        }

        logStep("Subscription deleted", { artisanId: artisan.id });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const artisan = await getArtisanByStripeCustomerId(customerId);
        if (!artisan) break;

        await updateArtisan(artisan.id, {
          subscription_status: "active",
        });

        await logEvent(
          artisan.id,
          event.type,
          event.id,
          "succeeded",
          invoice.amount_paid,
          { invoice_id: invoice.id }
        );

        logStep("Payment succeeded", { artisanId: artisan.id, amount: invoice.amount_paid });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const artisan = await getArtisanByStripeCustomerId(customerId);
        if (!artisan) break;

        await updateArtisan(artisan.id, {
          subscription_status: "payment_failed",
        });

        await logEvent(
          artisan.id,
          event.type,
          event.id,
          "failed",
          invoice.amount_due,
          { invoice_id: invoice.id }
        );

        if (artisan.email) {
          await sendEmail(
            artisan.email,
            "🚨 Échec de paiement - Action requise",
            wrapEmail(
              "Échec de paiement",
              `<p>Le paiement de votre abonnement Artisan Validé a échoué.</p><p><strong>Votre profil sera masqué des résultats de recherche</strong> tant que le paiement ne sera pas régularisé.</p><p>Mettez à jour votre moyen de paiement pour restaurer votre visibilité.</p>`,
              "https://artisansvalides.fr/artisan/abonnement",
              "Mettre à jour mon paiement"
            )
          );
        }

        logStep("Payment failed", { artisanId: artisan.id });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    logStep("Error processing event", { error: String(err), type: event.type });
    return new Response("Processing error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
