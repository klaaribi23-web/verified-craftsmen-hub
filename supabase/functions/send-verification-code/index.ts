import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Generate a random 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface SendCodeRequest {
  email: string;
  userId: string;
  userType: "client" | "artisan";
  firstName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, userType, firstName }: SendCodeRequest = await req.json();

    console.log("Sending verification code to:", email);

    // Create Supabase client with service role for database access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds from now

    // Delete any existing codes for this user
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("user_id", userId);

    // Insert new verification code
    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        user_id: userId,
        email: email,
        code: code,
        user_type: userType,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      });

    if (insertError) {
      console.error("Error inserting verification code:", insertError);
      throw new Error("Erreur lors de la création du code de vérification");
    }

    // Send email with Resend
    const emailResponse = await resend.emails.send({
      from: "Artisans Validés <onboarding@resend.dev>",
      to: [email],
      subject: "Votre code de vérification - Artisans Validés",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #0f172a; font-size: 24px; margin: 0;">Artisans Validés</h1>
                </div>
                
                <h2 style="color: #0f172a; font-size: 20px; margin-bottom: 20px; text-align: center;">
                  Bonjour${firstName ? ` ${firstName}` : ''} !
                </h2>
                
                <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
                  Voici votre code de vérification pour finaliser votre inscription :
                </p>
                
                <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d56c 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                  <span style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${code}</span>
                </div>
                
                <p style="color: #ef4444; font-size: 14px; text-align: center; margin-bottom: 20px; font-weight: 500;">
                  ⏱️ Ce code expire dans 60 secondes
                </p>
                
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
                  Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.
                </p>
              </div>
              
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
                © ${new Date().getFullYear()} Artisans Validés - Tous droits réservés
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Code envoyé" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-code function:", error);
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
