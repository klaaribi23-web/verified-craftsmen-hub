import { useSubscriptionContext } from "@/contexts/SubscriptionContext";

export const useSubscription = () => {
  return useSubscriptionContext();
};
