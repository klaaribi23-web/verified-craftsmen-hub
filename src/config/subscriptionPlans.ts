// Stripe Price IDs
export const STRIPE_PRICES = {
  essential: {
    monthly: "price_1SnLhgHsPR7NolTlCZJY5r3T",
    yearly: "price_1SnLhuHsPR7NolTlBBcZ6KLo",
  },
  pro: {
    monthly: "price_1SnLi9HsPR7NolTlFihKief9",
    yearly: "price_1SnLiLHsPR7NolTlo2WwBzYd",
  },
};

export type SubscriptionTier = "free" | "essential" | "pro" | "elite";
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
  id: SubscriptionTier;
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

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Gratuit",
    description: "Pour démarrer sur la plateforme",
    priority: 100,
    priorityLabel: "Standard",
    prices: {
      monthly: 0,
      yearly: 0,
    },
    features: {
      missionsPerMonth: 1,
      statistics: false,
      devisAI: false,
      storiesLive: false,
      support: "standard",
      betaAccess: false,
      badge: null,
      badgeLabel: null,
    },
  },
  {
    id: "essential",
    name: "Essentiel",
    description: "Pour les artisans actifs",
    priority: { min: 11, max: 20 },
    priorityLabel: "Top 11-20",
    prices: {
      monthly: 29.90,
      yearly: 299,
    },
    features: {
      missionsPerMonth: 30,
      statistics: true,
      devisAI: false,
      storiesLive: true,
      support: "priority",
      betaAccess: false,
      badge: "bronze",
      badgeLabel: "Pro",
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour maximiser votre visibilité",
    priority: { min: 4, max: 10 },
    priorityLabel: "Top 4-10",
    prices: {
      monthly: 59.90,
      yearly: 599,
    },
    features: {
      missionsPerMonth: "unlimited",
      statistics: true,
      devisAI: true,
      storiesLive: true,
      support: "dedicated",
      betaAccess: false,
      badge: "silver",
      badgeLabel: "Premium",
    },
  },
  {
    id: "elite",
    name: "Elite",
    description: "L'excellence pour votre entreprise",
    priority: { min: 1, max: 3 },
    priorityLabel: "Top 1-3",
    prices: {
      monthly: 99.90,
      yearly: 999,
    },
    features: {
      missionsPerMonth: "unlimited",
      statistics: true,
      devisAI: true,
      storiesLive: true,
      support: "vip",
      betaAccess: true,
      badge: "gold",
      badgeLabel: "Elite",
    },
    isContactSales: true,
  },
];

export const getPlanById = (id: SubscriptionTier): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
};

export const getPlanByBadge = (badge: "bronze" | "silver" | "gold"): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find((plan) => plan.features.badge === badge);
};
