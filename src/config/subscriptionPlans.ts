// Stripe Price IDs - Offre unique Artisan Validé 99€ HT/mois
export const STRIPE_PRICES = {
  artisan_valide: {
    monthly: "price_1SyIOVHsPR7NolTlZfj6dkKt",
  },
};

export const STRIPE_PRODUCT_ID = "prod_TwAjvtmZUKLDW7";

export type SubscriptionTier = "free" | "artisan_valide";
export type BillingInterval = "monthly";

export interface PlanFeatures {
  missionsPerMonth: number | "unlimited";
  statistics: boolean;
  devisAI: boolean;
  storiesLive: boolean;
  support: "standard" | "dedicated";
  betaAccess: boolean;
  badge: "gold" | null;
  badgeLabel: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceHT: number;
  features: PlanFeatures;
}

export interface BoosterOffer {
  id: string;
  name: string;
  description: string;
  priceHT: number;
  guarantee: string;
}

export const SUBSCRIPTION_PLAN: SubscriptionPlan = {
  id: "artisan_valide",
  name: "Artisan Validé",
  description: "Votre visibilité maximale, vos chantiers qualifiés.",
  priceHT: 99,
  features: {
    missionsPerMonth: "unlimited",
    statistics: true,
    devisAI: true,
    storiesLive: true,
    support: "dedicated",
    betaAccess: true,
    badge: "gold",
    badgeLabel: "Artisan Validé",
  },
};

export const BOOSTER_OFFER: BoosterOffer = {
  id: "booster",
  name: "Booster",
  description: "3 rendez-vous chantier qualifiés garantis par notre équipe. Si nous n'atteignons pas l'objectif, nous vous remboursons.",
  priceHT: 500,
  guarantee: "3 RDV qualifiés garantis ou remboursé",
};

// Keep backward compatibility
export const SUBSCRIPTION_PLANS = [SUBSCRIPTION_PLAN];
export const getPlanById = (id: string) => id === "artisan_valide" ? SUBSCRIPTION_PLAN : undefined;
