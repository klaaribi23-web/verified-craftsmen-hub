import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, userId }: VerifyCodeRequest = await req.json();

    console.log("Verifying code for:", email);

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the verification code from database
    const { data: verificationData, error: fetchError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("email", email)
      .single();

    if (fetchError || !verificationData) {
      console.error("No verification code found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Code de vérification introuvable. Veuillez demander un nouveau code." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if code is expired
    const expiresAt = new Date(verificationData.expires_at);
    if (new Date() > expiresAt) {
      // Delete expired code
      await supabaseAdmin
        .from("verification_codes")
        .delete()
        .eq("id", verificationData.id);

      return new Response(
        JSON.stringify({ error: "Code expiré. Veuillez demander un nouveau code." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check attempts (max 3)
    if (verificationData.attempts >= 3) {
      // Delete code after too many attempts
      await supabaseAdmin
        .from("verification_codes")
        .delete()
        .eq("id", verificationData.id);

      return new Response(
        JSON.stringify({ error: "Trop de tentatives. Veuillez demander un nouveau code." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if code matches
    if (verificationData.code !== code) {
      // Increment attempts
      await supabaseAdmin
        .from("verification_codes")
        .update({ attempts: verificationData.attempts + 1 })
        .eq("id", verificationData.id);

      const remainingAttempts = 2 - verificationData.attempts;
      return new Response(
        JSON.stringify({ 
          error: `Code incorrect. ${remainingAttempts > 0 ? `${remainingAttempts} tentative(s) restante(s).` : "Dernière tentative."}` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Code is valid! Update user's email confirmation status
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (updateError) {
      console.error("Error confirming email:", updateError);
      throw new Error("Erreur lors de la confirmation de l'email");
    }

    // Delete the used verification code
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("id", verificationData.id);

    console.log("Email verified successfully for:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email vérifié avec succès",
        userType: verificationData.user_type 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
