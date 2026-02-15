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
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A192F; color: #ffffff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #FFB800, #f0a500); padding: 24px; text-align: center;">
        <h1 style="color: #0A192F; margin: 0; font-size: 22px; font-weight: 800;">🔑 Vos accès sont prêts !</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="color: rgba(255,255,255,0.85); font-size: 16px;">Bonjour <strong style="color: #FFB800;">${firstName}</strong>,</p>
        <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6;">
          Votre espace artisan est activé. Voici vos identifiants de connexion :
        </p>
        <div style="background: rgba(255,184,0,0.1); border: 1px solid rgba(255,184,0,0.3); border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.6); font-size: 13px;">📧 E-mail :</p>
          <p style="margin: 0 0 16px 0; color: #FFB800; font-size: 16px; font-weight: bold;">${email}</p>
          <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.6); font-size: 13px;">🔒 Mot de passe temporaire :</p>
          <p style="margin: 0; color: #FFB800; font-size: 16px; font-weight: bold; font-family: monospace;">${password}</p>
        </div>
        <p style="color: rgba(255,255,255,0.5); font-size: 12px;">⚠️ Nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #FFB800, #f0a500); color: #0A192F; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
            Accéder à mon espace →
          </a>
        </div>
        <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center;">
          📞 Support : 09 70 70 70 70
        </p>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Artisans Vérifiés <onboarding@resend.dev>",
        to: [email],
        subject: "🔑 Vos accès artisan sont prêts",
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
