import { supabase } from "@/integrations/supabase/client";

// Generate a simple device fingerprint based on browser info
function generateDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ];
  
  // Simple hash function
  const str = components.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Parse user agent to get browser and OS info
function parseUserAgent(): { browser: string; os: string } {
  const ua = navigator.userAgent;
  
  // Browser detection
  let browser = "Unknown";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
  else if (ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  
  // OS detection
  let os = "Unknown";
  if (ua.includes("Windows NT 10")) os = "Windows 10";
  else if (ua.includes("Windows NT 6.3")) os = "Windows 8.1";
  else if (ua.includes("Windows NT 6.2")) os = "Windows 8";
  else if (ua.includes("Windows NT 6.1")) os = "Windows 7";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  
  return { browser, os };
}

// Get user's IP address (via a public API)
async function getIpAddress(): Promise<string | undefined> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch {
    return undefined;
  }
}

export async function notifyNewDeviceLogin(userId: string): Promise<void> {
  try {
    const { browser, os } = parseUserAgent();
    const fingerprint = generateDeviceFingerprint();
    const ipAddress = await getIpAddress();

    await supabase.functions.invoke("send-security-notification", {
      body: {
        userId,
        type: "new_device_login",
        deviceInfo: {
          fingerprint,
          browser,
          os,
          ipAddress,
        },
      },
    });
  } catch (error) {
    console.error("Error sending new device notification:", error);
  }
}

export async function notifyPasswordChanged(userId: string): Promise<void> {
  try {
    await supabase.functions.invoke("send-security-notification", {
      body: {
        userId,
        type: "password_changed",
      },
    });
  } catch (error) {
    console.error("Error sending password change notification:", error);
  }
}

export async function notifyEmailChanged(userId: string): Promise<void> {
  try {
    await supabase.functions.invoke("send-security-notification", {
      body: {
        userId,
        type: "email_changed",
      },
    });
  } catch (error) {
    console.error("Error sending email change notification:", error);
  }
}
