import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmEmailRequest {
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: ConfirmEmailRequest = await req.json();

    // Validate token
    if (!token || typeof token !== "string" || token.trim() === "") {
      console.error("[confirm-email] Invalid or missing token");
      return new Response(
        JSON.stringify({ success: false, message: "Token de confirmation invalide." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[confirm-email] Processing token confirmation");

    // Create Supabase client with service role (bypass RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find profile by confirmation token where email is not yet confirmed
    const { data: profile, error: findError } = await supabase
      .from("profiles")
      .select("id, email, first_name, email_confirmed")
      .eq("confirmation_token", token.trim())
      .eq("email_confirmed", false)
      .maybeSingle();

    if (findError) {
      console.error("[confirm-email] Error finding profile:", findError);
      return new Response(
        JSON.stringify({ success: false, message: "Erreur lors de la vérification du token." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!profile) {
      console.log("[confirm-email] Token not found or already used");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Ce lien de confirmation est invalide ou a déjà été utilisé." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update profile: mark email as confirmed and clear token
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email_confirmed: true,
        confirmation_token: null,
        confirmation_sent_at: null,
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[confirm-email] Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ success: false, message: "Erreur lors de la confirmation de l'email." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[confirm-email] Email confirmed successfully for: ${profile.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email confirmé avec succès !",
        email: profile.email,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[confirm-email] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Une erreur inattendue s'est produite." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
