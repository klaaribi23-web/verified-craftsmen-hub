import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginAttemptRequest {
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, success, ipAddress, userAgent }: LoginAttemptRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if IP is blocked
    const { data: isBlocked } = await supabase.rpc("is_ip_blocked", {
      p_ip_address: ipAddress || "unknown",
    });

    if (isBlocked && !success) {
      console.log(`Blocked IP attempted login: ${ipAddress}`);
      
      // Log the blocked attempt
      await supabase.from("security_logs").insert({
        action: "blocked_login_attempt",
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { email, reason: "IP temporarily blocked due to too many failed attempts" },
        severity: "warning",
      });

      return new Response(
        JSON.stringify({ 
          error: "Too many failed attempts. Please try again in 15 minutes.",
          blocked: true 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record the login attempt
    const { error: insertError } = await supabase.from("login_attempts").insert({
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
      success,
    });

    if (insertError) {
      console.error("Error inserting login attempt:", insertError);
    }

    // If failed attempt, check if we should alert
    if (!success) {
      // Count recent failed attempts for this email
      const { count } = await supabase
        .from("login_attempts")
        .select("*", { count: "exact", head: true })
        .eq("email", email)
        .eq("success", false)
        .gte("attempted_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());

      if (count && count >= 3) {
        // Log security event
        await supabase.from("security_logs").insert({
          action: "multiple_failed_logins",
          ip_address: ipAddress,
          user_agent: userAgent,
          details: { email, failed_count: count },
          severity: count >= 5 ? "critical" : "warning",
        });

        // If 5+ attempts, consider sending alert email to user
        if (count >= 5) {
          console.log(`Critical: ${count} failed login attempts for ${email} from IP ${ipAddress}`);
          
          // Optionally send security alert email
          try {
            await supabase.functions.invoke("send-security-alert", {
              body: {
                email,
                type: "multiple_failed_logins",
                details: { ip_address: ipAddress, attempt_count: count },
              },
            });
          } catch (emailError) {
            console.error("Failed to send security alert:", emailError);
          }
        }
      }
    } else {
      // Successful login - log it
      await supabase.from("security_logs").insert({
        action: "successful_login",
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { email },
        severity: "info",
      });
    }

    return new Response(
      JSON.stringify({ success: true, blocked: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in track-login-attempt:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
