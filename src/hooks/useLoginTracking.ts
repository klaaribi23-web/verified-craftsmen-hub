import { supabase } from "@/integrations/supabase/client";

interface TrackLoginParams {
  email: string;
  success: boolean;
}

// Get IP address from public API
async function getIpAddress(): Promise<string | undefined> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch {
    return undefined;
  }
}

export async function trackLoginAttempt({ email, success }: TrackLoginParams): Promise<{
  blocked: boolean;
  error?: string;
}> {
  try {
    const ipAddress = await getIpAddress();
    const userAgent = navigator.userAgent;

    const { data, error } = await supabase.functions.invoke("track-login-attempt", {
      body: {
        email,
        success,
        ipAddress,
        userAgent,
      },
    });

    if (error) {
      console.error("Error tracking login attempt:", error);
      return { blocked: false };
    }

    return {
      blocked: data?.blocked || false,
      error: data?.error,
    };
  } catch (error) {
    console.error("Failed to track login attempt:", error);
    return { blocked: false };
  }
}

// Check if current IP is blocked before attempting login
export async function checkIfBlocked(): Promise<boolean> {
  try {
    const ipAddress = await getIpAddress();
    
    if (!ipAddress) return false;

    const { data, error } = await supabase.rpc("is_ip_blocked", {
      p_ip_address: ipAddress,
    });

    if (error) {
      console.error("Error checking if blocked:", error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error("Failed to check if blocked:", error);
    return false;
  }
}
