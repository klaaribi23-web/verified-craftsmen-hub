import { useQuoteNotifications } from "@/hooks/useQuoteNotifications";

// This component initializes real-time quote notifications
// It should be placed inside the BrowserRouter to have access to routing context
export const QuoteNotificationListener = () => {
  // Initialize the hook to start listening for notifications
  useQuoteNotifications();
  
  return null;
};
