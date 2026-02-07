// Deno.serve used below
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendRequest {
  email: string;
  firstName?: string;
  userType?: "client" | "artisan";
}

const RATE_LIMIT_SECONDS = 60; // Server-side rate limit: 60 seconds

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, userType }: ResendRequest = await req.json();

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      console.error("[resend-confirmation-email] Invalid email provided");
      return new Response(
        JSON.stringify({ success: false, message: "Email invalide." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[resend-confirmation-email] Processing resend request for: ${email}`);

    // Create Supabase client with service role (bypass RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find profile by email where email is not yet confirmed
    const { data: profile, error: findError } = await supabase
      .from("profiles")
      .select("id, first_name, confirmation_sent_at, email_confirmed")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (findError) {
      console.error("[resend-confirmation-email] Error finding profile:", findError);
      return new Response(
        JSON.stringify({ success: false, message: "Erreur lors de la recherche du profil." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!profile) {
      // Don't reveal whether email exists for security
      console.log("[resend-confirmation-email] Profile not found for email");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Aucun compte en attente de confirmation trouvé pour cet email." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if email is already confirmed
    if (profile.email_confirmed === true) {
      console.log("[resend-confirmation-email] Email already confirmed");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Cet email est déjà confirmé. Vous pouvez vous connecter." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Server-side rate limiting: check confirmation_sent_at
    if (profile.confirmation_sent_at) {
      const lastSent = new Date(profile.confirmation_sent_at);
      const now = new Date();
      const secondsSinceLastSend = (now.getTime() - lastSent.getTime()) / 1000;

      if (secondsSinceLastSend < RATE_LIMIT_SECONDS) {
        const remainingSeconds = Math.ceil(RATE_LIMIT_SECONDS - secondsSinceLastSend);
        console.log(`[resend-confirmation-email] Rate limit hit. Wait ${remainingSeconds}s`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Veuillez patienter ${remainingSeconds} secondes avant de renvoyer l'email.`,
            cooldownRemaining: remainingSeconds,
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Generate new confirmation token
    const confirmationToken = crypto.randomUUID();

    // Update profile with new token and timestamp
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        confirmation_token: confirmationToken,
        confirmation_sent_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[resend-confirmation-email] Error updating token:", updateError);
      return new Response(
        JSON.stringify({ success: false, message: "Erreur lors de la génération du nouveau lien." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build confirmation URL
    // Use the referer or a default domain for the confirmation URL
    const origin = req.headers.get("origin") || "https://artisansvalides.fr";
    const confirmationUrl = `${origin}/confirmer-email?token=${confirmationToken}`;

    console.log(`[resend-confirmation-email] New token generated, sending email`);

    // Call send-confirmation-email Edge Function
    const { error: emailError } = await supabase.functions.invoke("send-confirmation-email", {
      body: {
        email: email.trim(),
        firstName: firstName || profile.first_name || "Utilisateur",
        userType: userType || "client",
        confirmationUrl,
      },
    });

    if (emailError) {
      console.error("[resend-confirmation-email] Error sending email:", emailError);
      return new Response(
        JSON.stringify({ success: false, message: "Erreur lors de l'envoi de l'email." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[resend-confirmation-email] Email resent successfully to: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Un nouvel email de confirmation a été envoyé.",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[resend-confirmation-email] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Une erreur inattendue s'est produite." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
