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
  createCheckout: (priceId: string) => Promise<string | null>;
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

  const createCheckout = async (priceId: string): Promise<string | null> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Vous devez être connecté pour vous abonner");
      }

      // Race between the fetch and a 5s timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      let data: unknown;
      let error: unknown;
      try {
        const res = await supabase.functions.invoke("create-checkout", {
          body: { price_id: priceId },
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });
        data = res.data;
        error = res.error;
      } catch (fetchErr: unknown) {
        if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
          throw new Error("ERREUR DE TIMEOUT — L'Edge Function n'a pas répondu en 5 secondes.");
        }
        throw fetchErr;
      } finally {
        clearTimeout(timeout);
      }

      if (error) throw error;

      const responseData = typeof data === "string" ? JSON.parse(data) : data;

      if ((responseData as Record<string, unknown>)?.url) {
        const url = (responseData as Record<string, unknown>).url as string;
        // Force top-level navigation to break out of iframe
        try {
          window.top!.location.href = url;
        } catch {
          window.location.href = url;
        }
        return url;
      } else if ((responseData as Record<string, unknown>)?.error) {
        throw new Error((responseData as Record<string, unknown>).error as string);
      } else {
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
