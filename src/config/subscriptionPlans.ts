// Stripe Price IDs
export const STRIPE_PRICES = {
  artisan_valide: {
    monthly: "price_1SyIOVHsPR7NolTlZfj6dkKt",
    yearly: "price_1SyKitHsPR7NolTlEe2pz30d",
  },
};

export const STRIPE_PRODUCT_IDS = {
  artisan_valide_monthly: "prod_TwAjvtmZUKLDW7",
  artisan_valide_yearly: "prod_TwD9dvf0BhK26h",
};

export type SubscriptionTier = "free" | "artisan_valide" | "legacy";
export type BillingInterval = "monthly" | "yearly";

export interface PlanFeatures {
  missionsPerMonth: number | "unlimited";
  statistics: boolean;
  devisAI: boolean;
  storiesLive: boolean;
  support: "standard" | "dedicated";
  betaAccess: boolean;
  badge: "gold" | null;
  badgeLabel: string | null;
  isAudited: boolean;
  guaranteedRDV: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceHT: number;
  interval: BillingInterval;
  features: PlanFeatures;
  highlight?: string;
}

export const MONTHLY_PLAN: SubscriptionPlan = {
  id: "artisan_valide_monthly",
  name: "Mensuel",
  description: "Accès complet à la plateforme, sans engagement.",
  priceHT: 99,
  interval: "monthly",
  features: {
    missionsPerMonth: "unlimited",
    statistics: true,
    devisAI: true,
    storiesLive: true,
    support: "dedicated",
    betaAccess: true,
    badge: "gold",
    badgeLabel: "Artisan Validé",
    isAudited: false,
    guaranteedRDV: 0,
  },
};

export const YEARLY_PLAN: SubscriptionPlan = {
  id: "artisan_valide_yearly",
  name: "Boost Annuel",
  description: "Pack Sérénité : Badge Audité Offert + 3 RDV Qualifiés Garantis",
  priceHT: 990,
  interval: "yearly",
  highlight: "LE MEILLEUR DEAL",
  features: {
    missionsPerMonth: "unlimited",
    statistics: true,
    devisAI: true,
    storiesLive: true,
    support: "dedicated",
    betaAccess: true,
    badge: "gold",
    badgeLabel: "Artisan Validé",
    isAudited: true,
    guaranteedRDV: 3,
  },
};

// Backward compatibility
export const SUBSCRIPTION_PLAN = MONTHLY_PLAN;
export const SUBSCRIPTION_PLANS = [MONTHLY_PLAN, YEARLY_PLAN];
export const getPlanById = (id: string) => SUBSCRIPTION_PLANS.find(p => p.id === id);
