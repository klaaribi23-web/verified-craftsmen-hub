import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Price ID to tier mapping
const PRICE_TO_TIER: Record<string, string> = {
  // Essentiel
  price_1SnLhgHsPR7NolTlCZJY5r3T: "essential",
  price_1SnLhuHsPR7NolTlBBcZ6KLo: "essential",
  // Pro
  price_1SnLi9HsPR7NolTlFihKief9: "pro",
  price_1SnLiLHsPR7NolTlo2WwBzYd: "pro",
  // Elite
  price_1SnMvzHsPR7NolTlvlCq5LTo: "elite",
  price_1SnMwfHsPR7NolTlpskUuvfB: "elite",
};

// Price ID to interval mapping
const PRICE_TO_INTERVAL: Record<string, "monthly" | "yearly"> = {
  price_1SnLhgHsPR7NolTlCZJY5r3T: "monthly",
  price_1SnLhuHsPR7NolTlBBcZ6KLo: "yearly",
  price_1SnLi9HsPR7NolTlFihKief9: "monthly",
  price_1SnLiLHsPR7NolTlo2WwBzYd: "yearly",
  price_1SnMvzHsPR7NolTlvlCq5LTo: "monthly",
  price_1SnMwfHsPR7NolTlpskUuvfB: "yearly",
};

// Tier to priority mapping
const TIER_PRIORITIES: Record<string, { min: number; max: number } | number> = {
  elite: { min: 1, max: 3 },
  pro: { min: 4, max: 10 },
  essential: { min: 11, max: 20 },
  free: 100,
};

// Plan names for notifications
const PLAN_NAMES: Record<string, string> = {
  free: "Gratuit",
  essential: "Essentiel",
  pro: "Pro",
  elite: "Elite",
};

// Plan prices for notifications
const PLAN_PRICES: Record<string, Record<string, string>> = {
  essential: { monthly: "29,90", yearly: "299" },
  pro: { monthly: "59,90", yearly: "599" },
  elite: { monthly: "99,90", yearly: "999" },
};

// Tier priority for comparison (lower = higher tier)
const TIER_ORDER: Record<string, number> = {
  elite: 1,
  pro: 2,
  essential: 3,
  free: 4,
};

type SubscriptionNotificationType =
  | "subscription_started"
  | "subscription_upgraded"
  | "subscription_downgraded"
  | "subscription_canceled";

const sendSubscriptionNotification = async (
  userId: string,
  type: SubscriptionNotificationType,
  planDetails: {
    previousTier?: string;
    newTier: string;
    planName: string;
    previousPlanName?: string;
    price?: string;
    interval?: string;
    subscriptionEnd?: string | null;
  },
) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      logStep("Missing environment variables for notification");
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-subscription-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ userId, type, planDetails }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Notification failed", { status: response.status, error: errorText });
    } else {
      logStep("Notification sent successfully", { type, newTier: planDetails.newTier });
    }
  } catch (error) {
    logStep("Error sending notification", { error: error instanceof Error ? error.message : error });
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, user is on free tier");

      // Update artisan to free tier
      await supabaseClient
        .from("artisans")
        .update({
          subscription_tier: "free",
          stripe_customer_id: null,
          subscription_end: null,
          display_priority: 100,
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null,
          subscription_start: null,
          billing_interval: null,
          payment_method: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get current artisan data to detect changes
    const { data: currentArtisan } = await supabaseClient
      .from("artisans")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    const previousTier = currentArtisan?.subscription_tier || "free";
    logStep("Current artisan tier", { previousTier });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");

      // Check if this is a cancellation (was paying, now free)
      if (previousTier !== "free") {
        logStep("Subscription canceled detected", { previousTier });

        // Send cancellation notification
        await sendSubscriptionNotification(user.id, "subscription_canceled", {
          previousTier,
          newTier: "free",
          planName: PLAN_NAMES["free"],
          previousPlanName: PLAN_NAMES[previousTier] || previousTier,
        });
      }

      // Update artisan to free tier
      await supabaseClient
        .from("artisans")
        .update({
          subscription_tier: "free",
          stripe_customer_id: customerId,
          subscription_end: null,
          display_priority: 100,
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null,
          subscription_start: null,
          billing_interval: null,
          payment_method: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    const tier = PRICE_TO_TIER[priceId] || "free";
    const billingInterval = PRICE_TO_INTERVAL[priceId] || "monthly";

    // Log raw Stripe values for debugging
    logStep("Raw Stripe subscription data", {
      current_period_end: subscription.current_period_end,
      start_date: subscription.start_date,
      created: subscription.created,
    });

    // Safely handle dates - check for undefined/null explicitly (0 is a valid timestamp)
    const subscriptionEnd =
      subscription.current_period_end !== undefined && subscription.current_period_end !== null
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
    const subscriptionStart =
      subscription.start_date !== undefined && subscription.start_date !== null
        ? new Date(subscription.start_date * 1000).toISOString()
        : subscription.created !== undefined && subscription.created !== null
          ? new Date(subscription.created * 1000).toISOString()
          : null;

    logStep("Active subscription found", {
      subscriptionId: subscription.id,
      priceId,
      tier,
      subscriptionEnd,
      subscriptionStart,
      billingInterval,
    });

    // Detect subscription changes and send notifications
    if (previousTier !== tier) {
      logStep("Subscription tier changed", { previousTier, newTier: tier });

      const planPrice = PLAN_PRICES[tier]?.[billingInterval];
      const planDetails = {
        previousTier,
        newTier: tier,
        planName: PLAN_NAMES[tier] || tier,
        previousPlanName: PLAN_NAMES[previousTier] || previousTier,
        price: planPrice,
        interval: billingInterval,
        subscriptionEnd,
      };

      let notificationType: SubscriptionNotificationType;

      if (previousTier === "free" && tier !== "free") {
        // New subscription
        notificationType = "subscription_started";
        logStep("New subscription detected");
      } else if (TIER_ORDER[tier] < TIER_ORDER[previousTier]) {
        // Upgrade (lower order = higher tier)
        notificationType = "subscription_upgraded";
        logStep("Upgrade detected");
      } else {
        // Downgrade (but not to free, that's handled above)
        notificationType = "subscription_downgraded";
        logStep("Downgrade detected");
      }

      // Send notification asynchronously (don't block the response)
      sendSubscriptionNotification(user.id, notificationType, planDetails);
    }

    // Get payment method info
    let paymentMethod = null;
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
        limit: 1,
      });

      if (paymentMethods.data.length > 0) {
        const card = paymentMethods.data[0].card;
        if (card) {
          paymentMethod = {
            last4: card.last4,
            brand: card.brand,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
          };
          logStep("Payment method found", { brand: card.brand, last4: card.last4 });
        }
      }
    } catch (pmError) {
      logStep("Could not fetch payment method", { error: pmError });
    }

    // Calculate display priority
    const priorityConfig = TIER_PRIORITIES[tier];
    let displayPriority: number;

    if (typeof priorityConfig === "number") {
      displayPriority = priorityConfig;
    } else {
      // Assign a random priority within the range for this tier
      displayPriority = Math.floor(Math.random() * (priorityConfig.max - priorityConfig.min + 1) + priorityConfig.min);
    }

    // Update artisan with subscription info
    const { error: updateError } = await supabaseClient
      .from("artisans")
      .update({
        subscription_tier: tier,
        stripe_customer_id: customerId,
        subscription_end: subscriptionEnd,
        display_priority: displayPriority,
      })
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Error updating artisan", { error: updateError.message });
    } else {
      logStep("Artisan updated successfully", { tier, displayPriority });
    }

    return new Response(
      JSON.stringify({
        subscribed: true,
        subscription_tier: tier,
        subscription_end: subscriptionEnd,
        subscription_start: subscriptionStart,
        billing_interval: billingInterval,
        payment_method: paymentMethod,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
