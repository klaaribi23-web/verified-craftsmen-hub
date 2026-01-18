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

// Price to tier mapping
const PRICE_TO_TIER: Record<string, string> = {
  // Monthly prices
  "price_1RQn8tIBEMmaMqlKBr9WD8F2": "essentiel",
  "price_1RQn9tIBEMmaMqlKONEgQc8V": "pro",
  "price_1RQnAmIBEMmaMqlKMXmIhWsn": "elite",
  // Yearly prices
  "price_1RQnBVIBEMmaMqlKlMlALt4m": "essentiel",
  "price_1RQnC8IBEMmaMqlKLy2hwNkq": "pro",
  "price_1RQnCmIBEMmaMqlKxJ8CG0Oj": "elite",
};

const PRICE_TO_INTERVAL: Record<string, string> = {
  // Monthly prices
  "price_1RQn8tIBEMmaMqlKBr9WD8F2": "monthly",
  "price_1RQn9tIBEMmaMqlKONEgQc8V": "monthly",
  "price_1RQnAmIBEMmaMqlKMXmIhWsn": "monthly",
  // Yearly prices
  "price_1RQnBVIBEMmaMqlKlMlALt4m": "yearly",
  "price_1RQnC8IBEMmaMqlKLy2hwNkq": "yearly",
  "price_1RQnCmIBEMmaMqlKxJ8CG0Oj": "yearly",
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
    
    const tier = priceId ? (PRICE_TO_TIER[priceId] || "unknown") : "unknown";
    const billingInterval = priceId ? (PRICE_TO_INTERVAL[priceId] || "monthly") : "monthly";
    
    // Get dates
    const subscriptionStart = subscription.start_date 
      ? new Date(subscription.start_date * 1000).toISOString()
      : (subscription.created ? new Date(subscription.created * 1000).toISOString() : null);
    
    const subscriptionEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    const priceAmount = subscription.items.data[0]?.price?.unit_amount || null;

    logStep("Subscription details fetched", {
      tier,
      billingInterval,
      subscriptionStart,
      subscriptionEnd,
    });

    return new Response(
      JSON.stringify({
        tier,
        billing_interval: billingInterval,
        subscription_start: subscriptionStart,
        subscription_end: subscriptionEnd,
        price_amount: priceAmount,
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