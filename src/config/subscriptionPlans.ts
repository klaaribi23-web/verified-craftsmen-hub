// Stripe Price IDs
export const STRIPE_PRICES = {
  exclusivite: {
    monthly: "price_exclusivite_monthly",
  },
  booster: {
    oneTime: "price_booster_one_time",
  },
};

export type SubscriptionTier = "free" | "exclusivite";
export type BillingInterval = "monthly" | "yearly";

export interface PlanFeatures {
  missionsPerMonth: number | "unlimited";
  statistics: boolean;
  devisAI: boolean;
  storiesLive: boolean;
  support: "standard" | "priority" | "dedicated" | "vip";
  betaAccess: boolean;
  badge: "bronze" | "silver" | "gold" | null;
  badgeLabel: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priority: { min: number; max: number } | number;
  priorityLabel: string;
  prices: {
    monthly: number;
    yearly: number;
  };
  features: PlanFeatures;
  isContactSales?: boolean;
}

export interface BoosterOffer {
  id: string;
  name: string;
  description: string;
  priceHT: number;
  guarantee: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "exclusivite",
    name: "Exclusivité",
    description: "Votre zone, vos chantiers. Visibilité maximale garantie.",
    priority: { min: 1, max: 3 },
    priorityLabel: "Top 3 de votre zone",
    prices: {
      monthly: 99,
      yearly: 990,
    },
    features: {
      missionsPerMonth: "unlimited",
      statistics: true,
      devisAI: true,
      storiesLive: true,
      support: "dedicated",
      betaAccess: true,
      badge: "gold",
      badgeLabel: "Artisan Exclusif",
    },
  },
];

export const BOOSTER_OFFER: BoosterOffer = {
  id: "booster",
  name: "Booster",
  description: "3 rendez-vous chantier qualifiés garantis par notre équipe. Si nous n'atteignons pas l'objectif, nous vous remboursons.",
  priceHT: 500,
  guarantee: "3 RDV qualifiés garantis ou remboursé",
};

export const getPlanById = (id: SubscriptionTier): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
};

export const getPlanByBadge = (badge: "bronze" | "silver" | "gold"): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find((plan) => plan.features.badge === badge);
};
