import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { BillingInterval } from "@/config/subscriptionPlans";

interface PaymentMethod {
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
}

interface SubscriptionState {
  tier: string;
  subscriptionEnd: string | null;
  subscriptionStart: string | null;
  billingInterval: BillingInterval | null;
  paymentMethod: PaymentMethod | null;
  isLoading: boolean;
  error: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
  createCheckout: (priceId: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    tier: "free",
    subscriptionEnd: null,
    subscriptionStart: null,
    billingInterval: null,
    paymentMethod: null,
    isLoading: true,
    error: null,
  });
  const [hasFetched, setHasFetched] = useState(false);

  const checkSubscription = useCallback(async (silent = false) => {
    if (!user) {
      setState({
        tier: "free",
        subscriptionEnd: null,
        subscriptionStart: null,
        billingInterval: null,
        paymentMethod: null,
        isLoading: false,
        error: null,
      });
      setHasFetched(true);
      return;
    }

    try {
      // Only show loading state on initial fetch, not on silent refreshes
      if (!silent && !hasFetched) {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        setState(prev => ({ ...prev, tier: "free", isLoading: false }));
        setHasFetched(true);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) throw error;

      setState({
        tier: data?.subscription_tier || "free",
        subscriptionEnd: data?.subscription_end || null,
        subscriptionStart: data?.subscription_start || null,
        billingInterval: data?.billing_interval || null,
        paymentMethod: data?.payment_method || null,
        isLoading: false,
        error: null,
      });
      setHasFetched(true);
    } catch (err) {
      // Silently fallback to free tier on any error (e.g. missing Stripe key)
      // This prevents the error banner from appearing in the UI
      console.warn("Subscription check unavailable, defaulting to free tier");
      setState({
        tier: "free",
        subscriptionEnd: null,
        subscriptionStart: null,
        billingInterval: null,
        paymentMethod: null,
        isLoading: false,
        error: null,
      });
      setHasFetched(true);
    }
  }, [user, hasFetched]);

  const createCheckout = async (priceId: string) => {
    try {
      console.log("[CHECKOUT] Starting checkout for price:", priceId);
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        console.error("[CHECKOUT] No access token found");
        throw new Error("Vous devez être connecté pour vous abonner");
      }
      console.log("[CHECKOUT] Access token found, invoking edge function...");

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: priceId },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      console.log("[CHECKOUT] Response received:", { data, error });

      if (error) {
        console.error("[CHECKOUT] Edge function error:", error);
        throw error;
      }

      // Handle case where data might be a string (needs parsing)
      const responseData = typeof data === "string" ? JSON.parse(data) : data;
      console.log("[CHECKOUT] Parsed data:", responseData);

      if (responseData?.url) {
        console.log("[CHECKOUT] Redirecting to Stripe:", responseData.url);
        window.location.assign(responseData.url);
      } else {
        console.error("[CHECKOUT] No URL in response:", responseData);
        throw new Error("Aucune URL de paiement reçue");
      }
    } catch (err) {
      console.error("[CHECKOUT] Error:", err);
      throw err;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Vous devez être connecté");
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      console.error("Error opening customer portal:", err);
      throw err;
    }
  };

  // Fetch subscription on user change
  useEffect(() => {
    if (user?.id) {
      checkSubscription(false);
    } else {
      setState({
        tier: "free",
        subscriptionEnd: null,
        subscriptionStart: null,
        billingInterval: null,
        paymentMethod: null,
        isLoading: false,
        error: null,
      });
      setHasFetched(false);
    }
  }, [user?.id]);

  // Silent auto-refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      checkSubscription(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return (
    <SubscriptionContext.Provider 
      value={{ 
        ...state, 
        checkSubscription: () => checkSubscription(false), 
        createCheckout, 
        openCustomerPortal 
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscriptionContext must be used within SubscriptionProvider");
  }
  return context;
};
