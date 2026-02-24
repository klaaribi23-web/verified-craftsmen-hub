import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendCredentialsEmail(email: string, password: string, firstName: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("[create-artisan-account] RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  const loginUrl = "https://verified-craftsmen-hub.lovable.app/connexion";

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#001529;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
        
        <!-- Header -->
        <tr><td style="padding:40px 40px 24px;text-align:center;border-bottom:2px solid rgba(255,184,0,0.15);">
          <div style="display:inline-block;background:rgba(255,184,0,0.1);border:1px solid rgba(255,184,0,0.25);border-radius:20px;padding:6px 18px;margin-bottom:20px;">
            <span style="color:#FFB800;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Accès Élite Accordé</span>
          </div>
          <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:16px 0 0;line-height:1.3;">
            Bienvenue dans l'Élite,<br><span style="color:#FFB800;">${firstName}</span>
          </h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.7;margin:0 0 24px;">
            Votre dossier a été examiné et validé par notre comité. Vous faites désormais partie du réseau exclusif <strong style="color:#FFB800;">Artisans Validés</strong> — une sélection rigoureuse limitée à 2 professionnels par zone.
          </p>

          <!-- Credentials Card -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,184,0,0.06);border:1px solid rgba(255,184,0,0.2);border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Identifiant</p>
              <p style="margin:0 0 18px;color:#ffffff;font-size:15px;font-weight:600;">${email}</p>
              <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Mot de passe temporaire</p>
              <p style="margin:0;color:#FFB800;font-size:16px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:1px;">${password}</p>
            </td></tr>
          </table>

          <!-- CTA Button -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:4px 0 8px;">
              <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#FFB800,#E5A600);color:#001529;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:800;font-size:14px;letter-spacing:1px;text-transform:uppercase;">
                Accéder à mon espace Élite →
              </a>
            </td></tr>
          </table>

          <p style="color:rgba(255,255,255,0.4);font-size:12px;text-align:center;margin:20px 0 0;">
            ⚠️ Nous vous recommandons de modifier votre mot de passe dès votre première connexion.
          </p>
        </td></tr>

        <!-- Signature -->
        <tr><td style="padding:28px 40px 12px;text-align:center;">
          <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 4px;font-style:italic;">À très vite sur la plateforme,</p>
          <p style="color:#FFB800;font-size:15px;font-weight:700;margin:0;">L'équipe Artisans Validés</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 40px 24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;line-height:1.6;">
            Artisans Validés — Le réseau des professionnels d'exception<br>
            📞 Support prioritaire : 09 70 70 70 70
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Andrea de Artisans Validés <equipe@artisansvalides.fr>",
        to: [email],
        subject: "🏆 Bienvenue dans l'Élite — Vos accès sont prêts",
        html: htmlBody,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("[create-artisan-account] Resend error:", JSON.stringify(result));
      return { success: false, error: result.message || "Email send failed" };
    }

    console.log("[create-artisan-account] Email sent successfully to", email, "id:", result.id);
    return { success: true, emailId: result.id };
  } catch (err) {
    console.error("[create-artisan-account] Email send exception:", err);
    return { success: false, error: String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, password, firstName, lastName, artisanId } = body;
    
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    // Auth: service role header, admin user token, OR self-activation with valid artisanId
    const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
    let isAuthorized = isServiceRole;
    
    if (!isAuthorized && artisanId) {
      const { data: artisanCheck } = await supabaseAdmin
        .from("artisans")
        .select("id, user_id")
        .eq("id", artisanId)
        .single();
      
      if (artisanCheck && !artisanCheck.user_id) {
        isAuthorized = true;
        console.log("[create-artisan-account] Self-activation for unclaimed artisan:", artisanId);
      }
    }

    if (!isAuthorized && authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (!claimsError && claimsData?.claims) {
        const callerUserId = claimsData.claims.sub as string;
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", callerUserId)
          .single();
        if (roleData?.role === "admin") {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[create-artisan-account] Creating account for: ${email}, artisanId: ${artisanId}`);

    // Step 0: Delete existing user if found (full reset)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      console.log(`[create-artisan-account] Existing user found: ${existingUser.id}, deleting for clean reset...`);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", existingUser.id);
      await supabaseAdmin.from("profiles").delete().eq("user_id", existingUser.id);
      await supabaseAdmin.from("artisans").update({ user_id: null, profile_id: null }).eq("user_id", existingUser.id);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error("Error deleting existing user:", deleteError);
        throw new Error(`Impossible de supprimer l'ancien compte: ${deleteError.message}`);
      }
      console.log(`[create-artisan-account] Old user deleted successfully`);
      await new Promise(r => setTimeout(r, 500));
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || "Artisan",
        last_name: lastName || "",
        user_type: "artisan",
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw authError;
    }

    const newUserId = authData.user.id;
    console.log("[create-artisan-account] Created auth user:", newUserId);

    // Step 2: Wait for trigger-created profile & role
    let profileId: string | null = null;
    let roleCreated = false;
    for (let i = 0; i < 8; i++) {
      const [profileRes, roleRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("id").eq("user_id", newUserId).single(),
        supabaseAdmin.from("user_roles").select("role").eq("user_id", newUserId).single(),
      ]);
      if (profileRes.data) profileId = profileRes.data.id;
      if (roleRes.data) roleCreated = true;
      if (profileId && roleCreated) break;
      await new Promise(r => setTimeout(r, 400));
    }

    if (!profileId) {
      console.log("[create-artisan-account] Profile not created by trigger, inserting manually");
      const { data: newProfile } = await supabaseAdmin.from("profiles").insert({
        user_id: newUserId, email,
        first_name: firstName || "Artisan", last_name: lastName || "",
        email_confirmed: true,
      }).select("id").single();
      profileId = newProfile?.id || null;
    }

    if (profileId) {
      await supabaseAdmin.from("profiles").update({ email_confirmed: true }).eq("user_id", newUserId);
    }

    if (!roleCreated) {
      await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: "artisan" });
    }

    // Step 3: Verify role is 'artisan'
    const { data: currentRole } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", newUserId).single();
    
    if (currentRole?.role !== "artisan") {
      await supabaseAdmin.from("user_roles").update({ role: "artisan" }).eq("user_id", newUserId);
    }

    // Step 4: Link artisan record
    if (artisanId) {
      const { error: linkError } = await supabaseAdmin
        .from("artisans")
        .update({ user_id: newUserId, profile_id: profileId, status: "active", is_verified: true, email })
        .eq("id", artisanId);

      if (linkError) console.error("Error linking artisan:", linkError);
      else console.log("Linked artisan", artisanId, "to user", newUserId);
    }

    // Step 5: Send credentials email via Resend
    const emailResult = await sendCredentialsEmail(email, password, firstName || "Artisan");
    
    if (!emailResult.success) {
      console.error("[create-artisan-account] Email failed but account created:", emailResult.error);
      return new Response(
        JSON.stringify({
          success: true,
          email_sent: false,
          email_error: emailResult.error,
          user_id: newUserId,
          profile_id: profileId,
          email,
          password, // Return password so frontend can show it as fallback
          message: "Compte créé mais l'envoi de l'e-mail a échoué",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: true,
        user_id: newUserId,
        profile_id: profileId,
        email,
        message: "Compte artisan créé et accès envoyés par e-mail",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
