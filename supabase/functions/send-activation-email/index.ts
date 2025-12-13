import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ActivationEmailRequest {
  artisanId: string;
  businessName: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting send-activation-email function");

    const { artisanId, businessName, email }: ActivationEmailRequest = await req.json();

    if (!artisanId || !businessName || !email) {
      console.error("Missing required fields:", { artisanId, businessName, email });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing activation for artisan: ${businessName} (${email})`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const activationToken = crypto.randomUUID();

    const { error: updateError } = await supabase
      .from("artisans")
      .update({
        activation_token: activationToken,
        activation_sent_at: new Date().toISOString(),
      })
      .eq("id", artisanId);

    if (updateError) {
      console.error("Error updating artisan with token:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to generate activation token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const baseUrl = Deno.env.get("SITE_URL") || "https://24ecf9bc-b2ec-49b3-9317-109ed9ace84c.lovable.app";
    const activationUrl = `${baseUrl}/activer-compte?token=${activationToken}`;

    console.log(`Activation URL: ${activationUrl}`);

    const emailResponse = await resend.emails.send({
      from: "Artisans Validés <onboarding@resend.dev>",
      to: [email],
      subject: "Votre fiche Artisans Validés est prête. Finalisez votre inscription !",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e3a5f; font-size: 28px; margin: 0;">🎉 Bienvenue sur Artisans Validés !</h1>
              </div>
              <div style="color: #333; font-size: 16px; line-height: 1.6;">
                <p>Bonjour <strong>${businessName}</strong>,</p>
                <p>Excellente nouvelle ! Votre fiche artisan a été créée sur notre plateforme par notre équipe.</p>
                <p>Pour finaliser votre inscription et prendre possession de votre compte, cliquez sur le bouton ci-dessous :</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${activationUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #d4a853 0%, #c9993a 100%); color: #1e3a5f; font-weight: bold; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px;">
                    Activer mon compte
                  </a>
                </div>
                <p>Une fois votre compte activé, vous pourrez :</p>
                <ul style="color: #555;">
                  <li>Compléter votre profil avec vos documents légaux</li>
                  <li>Ajouter vos réalisations et photos</li>
                  <li>Recevoir des demandes de devis de clients</li>
                </ul>
                <p style="color: #888; font-size: 14px; margin-top: 30px;">
                  Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.
                </p>
              </div>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 14px;">
                <p>L'équipe Artisans Validés</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Activation email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-activation-email function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
