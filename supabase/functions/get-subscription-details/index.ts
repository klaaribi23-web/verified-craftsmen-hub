import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-SUBSCRIPTION-DETAILS] ${step}${detailsStr}`);
};

// Price to tier mapping - Updated with real Stripe price IDs
const PRICE_TO_TIER: Record<string, string> = {
  // Monthly prices
  "price_1SnLhgHsPR7NolTlCZJY5r3T": "essentiel",  // 29,90€/mois
  "price_1SnLi9HsPR7NolTlFihKief9": "pro",        // 59,90€/mois
  "price_1SnMvzHsPR7NolTlvlCq5LTo": "elite",      // 99,90€/mois
  // Yearly prices
  "price_1SnLhuHsPR7NolTlBBcZ6KLo": "essentiel",  // 299€/an
  "price_1SnLiLHsPR7NolTlo2WwBzYd": "pro",        // 599€/an
  "price_1SnMwfHsPR7NolTlpskUuvfB": "elite",      // 999€/an
};

const PRICE_TO_INTERVAL: Record<string, string> = {
  // Monthly prices
  "price_1SnLhgHsPR7NolTlCZJY5r3T": "monthly",
  "price_1SnLi9HsPR7NolTlFihKief9": "monthly",
  "price_1SnMvzHsPR7NolTlvlCq5LTo": "monthly",
  // Yearly prices
  "price_1SnLhuHsPR7NolTlBBcZ6KLo": "yearly",
  "price_1SnLiLHsPR7NolTlo2WwBzYd": "yearly",
  "price_1SnMwfHsPR7NolTlpskUuvfB": "yearly",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verify admin authorization
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Admin access required");
    }

    logStep("Admin verified", { userId: userData.user.id });

    // Get request body
    const { stripe_customer_id } = await req.json();
    
    if (!stripe_customer_id) {
      throw new Error("stripe_customer_id is required");
    }

    logStep("Fetching subscription for customer", { stripe_customer_id });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");
      return new Response(
        JSON.stringify({
          tier: "free",
          billing_interval: "monthly",
          subscription_start: null,
          subscription_end: null,
          price_amount: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price?.id;
    
    logStep("Raw subscription data", {
      subscriptionId: subscription.id,
      priceId,
      currentPeriodEnd: subscription.current_period_end,
      startDate: subscription.start_date,
      created: subscription.created,
      status: subscription.status
    });
    
    const tier = priceId ? (PRICE_TO_TIER[priceId] || "unknown") : "unknown";
    const billingInterval = priceId ? (PRICE_TO_INTERVAL[priceId] || "monthly") : "monthly";
    
    // Get dates - handle both timestamp and null cases
    let subscriptionStart: string | null = null;
    if (subscription.start_date && typeof subscription.start_date === 'number') {
      subscriptionStart = new Date(subscription.start_date * 1000).toISOString();
    } else if (subscription.created && typeof subscription.created === 'number') {
      subscriptionStart = new Date(subscription.created * 1000).toISOString();
    }
    
    let subscriptionEnd: string | null = null;
    if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    }

    const priceAmount = subscription.items.data[0]?.price?.unit_amount || null;

    logStep("Subscription details processed", {
      tier,
      billingInterval,
      subscriptionStart,
      subscriptionEnd,
      priceAmount
    });

    // Get cancellation info
    const cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
    const canceledAt = subscription.canceled_at 
      ? new Date(subscription.canceled_at * 1000).toISOString() 
      : null;

    logStep("Cancellation info", { cancelAtPeriodEnd, canceledAt });

    return new Response(
      JSON.stringify({
        tier,
        billing_interval: billingInterval,
        subscription_start: subscriptionStart,
        subscription_end: subscriptionEnd,
        price_amount: priceAmount,
        canceled: cancelAtPeriodEnd,
        canceled_at: canceledAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500,
      }
    );
  }
});