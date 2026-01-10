import { supabase } from "@/integrations/supabase/client";

type NotificationType = 
  | "new_message" 
  | "quote_received" 
  | "quote_accepted" 
  | "quote_refused";

interface SendNotificationEmailParams {
  type: NotificationType;
  recipientEmail: string;
  recipientFirstName: string;
  senderName: string;
  quoteDescription?: string;
  quoteAmount?: number;
  messagePreview?: string;
}

export const sendNotificationEmail = async (params: SendNotificationEmailParams): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification-email", {
      body: params,
    });

    if (error) {
      console.error("Error sending notification email:", error);
      return false;
    }

    return data?.success ?? false;
  } catch (error) {
    console.error("Error in sendNotificationEmail:", error);
    return false;
  }
};

// Helper to get user email and name from profile
export const getUserEmailInfo = async (profileId: string): Promise<{ email: string; firstName: string } | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, first_name")
      .eq("id", profileId)
      .single();

    if (error || !data) {
      console.error("Error fetching user email info:", error);
      return null;
    }

    return {
      email: data.email,
      firstName: data.first_name || "Utilisateur",
    };
  } catch (error) {
    console.error("Error in getUserEmailInfo:", error);
    return null;
  }
};

// Helper to get artisan name from profile
export const getArtisanName = async (artisanId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("artisans")
      .select("business_name")
      .eq("id", artisanId)
      .single();

    if (error || !data) {
      return "Un artisan";
    }

    return data.business_name || "Un artisan";
  } catch (error) {
    return "Un artisan";
  }
};

// Helper to get client name from profile
export const getClientName = async (profileId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", profileId)
      .single();

    if (error || !data) {
      return "Un client";
    }

    const firstName = data.first_name || "";
    const lastName = data.last_name || "";
    return `${firstName} ${lastName}`.trim() || "Un client";
  } catch (error) {
    return "Un client";
  }
};
