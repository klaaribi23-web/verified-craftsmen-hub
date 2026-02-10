const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProjectRequestEmail {
  artisanEmail: string;
  artisanName: string;
  clientName: string;
  clientPhone: string;
  clientCity: string;
  projectDescription: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      artisanEmail,
      artisanName,
      clientName,
      clientPhone,
      clientCity,
      projectDescription,
    }: ProjectRequestEmail = await req.json();

    console.log(`[send-project-request-email] Sending to ${artisanEmail} for client ${clientName} in ${clientCity}`);

    if (!artisanEmail || !clientName || !clientCity) {
      throw new Error("Missing required fields");
    }

    const subject = `[Artisans Validés] Nouvelle demande de projet - ${clientCity}`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#182c44 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:12px;">
                <div style="background:linear-gradient(135deg,#D4AF37 0%,#F4D03F 100%);width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <span style="color:#182c44;font-weight:bold;font-size:16px;">AV</span>
                </div>
                <span style="color:#ffffff;font-size:20px;font-weight:700;">Artisans Validés</span>
              </div>
            </td>
          </tr>

          <!-- Icon -->
          <tr>
            <td style="padding:30px 40px 0;text-align:center;">
              <div style="display:inline-block;width:70px;height:70px;background-color:#16A34A15;border-radius:50%;line-height:70px;font-size:32px;">📩</div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:24px 40px 20px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#182c44;">
                Bonjour ${artisanName} !
              </h1>
              <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#16A34A;">
                Nouvelle demande de projet
              </h2>
              <p style="margin:0;font-size:16px;color:#444;line-height:1.6;">
                Un client souhaite vous contacter pour un projet à <strong>${clientCity}</strong>.
              </p>
            </td>
          </tr>

          <!-- Client info card -->
          <tr>
            <td style="padding:0 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#182c44;">👤 Coordonnées du client</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#333;"><strong>Nom :</strong> ${clientName}</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#333;"><strong>Téléphone :</strong> <a href="tel:${clientPhone}" style="color:#16A34A;text-decoration:none;font-weight:600;">${clientPhone}</a></p>
                    <p style="margin:0 0 8px;font-size:15px;color:#333;"><strong>Ville :</strong> ${clientCity}</p>
                    <hr style="border:none;border-top:1px solid #bbf7d0;margin:12px 0;">
                    <p style="margin:0;font-size:14px;color:#333;"><strong>Projet :</strong></p>
                    <p style="margin:8px 0 0;font-size:14px;color:#555;line-height:1.5;background:#fff;padding:12px;border-radius:8px;">${projectDescription}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 30px;text-align:center;">
              <a href="tel:${clientPhone}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#D4AF37 0%,#F4D03F 100%);color:#182c44;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;box-shadow:0 4px 16px rgba(212,175,55,0.35);">
                📞 Rappeler le client
              </a>
            </td>
          </tr>

          <!-- Tip -->
          <tr>
            <td style="padding:0 40px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8f9fa;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#666;text-align:center;">
                      💡 <strong>Astuce :</strong> Rappeler le client dans l'heure augmente vos chances de conclure de 80% !
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;background-color:#fafafa;">
              <p style="margin:0 0 8px;font-size:13px;color:#182c44;font-weight:600;">Artisans Validés</p>
              <p style="margin:0;font-size:10px;color:#ccc;">© ${new Date().getFullYear()} Artisans Validés - Tous droits réservés</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Artisans Validés <noreply@artisansvalides.fr>",
        to: [artisanEmail],
        subject,
        html,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("[send-project-request-email] Resend error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("[send-project-request-email] Email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-project-request-email] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders } }
    );
  }
});
