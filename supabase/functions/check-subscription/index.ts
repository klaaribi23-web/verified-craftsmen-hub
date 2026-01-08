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
  "price_1SnLhgHsPR7NolTlCZJY5r3T": "essential",
  "price_1SnLhuHsPR7NolTlBBcZ6KLo": "essential",
  // Pro
  "price_1SnLi9HsPR7NolTlFihKief9": "pro",
  "price_1SnLiLHsPR7NolTlo2WwBzYd": "pro",
};

// Price ID to interval mapping
const PRICE_TO_INTERVAL: Record<string, "monthly" | "yearly"> = {
  "price_1SnLhgHsPR7NolTlCZJY5r3T": "monthly",
  "price_1SnLhuHsPR7NolTlBBcZ6KLo": "yearly",
  "price_1SnLi9HsPR7NolTlFihKief9": "monthly",
  "price_1SnLiLHsPR7NolTlo2WwBzYd": "yearly",
};

// Tier to priority mapping
const TIER_PRIORITIES: Record<string, { min: number; max: number } | number> = {
  elite: { min: 1, max: 3 },
  pro: { min: 4, max: 10 },
  essential: { min: 11, max: 20 },
  free: 100,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");
      
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    const tier = PRICE_TO_TIER[priceId] || "free";
    const billingInterval = PRICE_TO_INTERVAL[priceId] || "monthly";
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const subscriptionStart = new Date(subscription.start_date * 1000).toISOString();

    logStep("Active subscription found", { subscriptionId: subscription.id, priceId, tier, subscriptionEnd, subscriptionStart, billingInterval });

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
      displayPriority = Math.floor(
        Math.random() * (priorityConfig.max - priorityConfig.min + 1) + priorityConfig.min
      );
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
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
