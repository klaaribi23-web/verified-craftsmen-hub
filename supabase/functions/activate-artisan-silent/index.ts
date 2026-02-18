import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, artisanId } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Find the artisan record
    let artisan;
    if (artisanId) {
      const { data } = await supabaseAdmin.from("artisans").select("id, business_name, user_id, email").eq("id", artisanId).single();
      artisan = data;
    } else {
      const { data } = await supabaseAdmin.from("artisans").select("id, business_name, user_id, email").eq("email", email).maybeSingle();
      artisan = data;
    }

    if (!artisan) {
      return new Response(
        JSON.stringify({ error: "Artisan introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. If artisan already has a user_id, just sign them in
    if (artisan.user_id) {
      console.log("[activate-silent] Artisan already linked to user:", artisan.user_id);
      
      // Generate a magic link token for auto-login
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
      });

      if (linkError) {
        console.error("[activate-silent] Magic link error:", linkError);
        throw linkError;
      }

      // Extract token from the link properties
      const token = linkData?.properties?.hashed_token;
      
      return new Response(
        JSON.stringify({
          success: true,
          action: "login",
          email: email,
          token: token,
          artisan_id: artisan.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Artisan has no user — create account silently
    const tempPassword = crypto.randomUUID().slice(0, 12) + "Ax1!";
    console.log("[activate-silent] Creating new account for:", email);

    // Delete existing auth user if any
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", existingUser.id);
      await supabaseAdmin.from("profiles").delete().eq("user_id", existingUser.id);
      await supabaseAdmin.from("artisans").update({ user_id: null, profile_id: null }).eq("user_id", existingUser.id);
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      await new Promise(r => setTimeout(r, 500));
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: artisan.business_name || "Artisan",
        last_name: "",
        user_type: "artisan",
      },
    });

    if (authError) throw authError;
    const newUserId = authData.user.id;

    // Wait for trigger-created profile & role
    let profileId: string | null = null;
    for (let i = 0; i < 8; i++) {
      const { data: p } = await supabaseAdmin.from("profiles").select("id").eq("user_id", newUserId).single();
      if (p) { profileId = p.id; break; }
      await new Promise(r => setTimeout(r, 400));
    }

    if (!profileId) {
      const { data: np } = await supabaseAdmin.from("profiles").insert({
        user_id: newUserId, email,
        first_name: artisan.business_name || "Artisan",
        email_confirmed: true,
      }).select("id").single();
      profileId = np?.id || null;
    }

    // Ensure artisan role
    const { data: roleCheck } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", newUserId).single();
    if (!roleCheck) {
      await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: "artisan" });
    } else if (roleCheck.role !== "artisan") {
      await supabaseAdmin.from("user_roles").update({ role: "artisan" }).eq("user_id", newUserId);
    }

    // Link artisan record
    await supabaseAdmin.from("artisans").update({
      user_id: newUserId,
      profile_id: profileId,
      status: "active",
      is_verified: true,
      email,
    }).eq("id", artisan.id);

    // Generate magic link for auto-login
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
    });

    if (linkError) throw linkError;

    const token = linkData?.properties?.hashed_token;

    // Send welcome email in background (non-blocking)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Jane de Artisans Validés <equipe@artisansvalides.fr>",
          to: [email],
          subject: "🏆 Bienvenue dans l'Élite — Votre accès est activé",
          html: `<div style="background:#001529;padding:40px;color:white;font-family:Arial;border-radius:12px;max-width:500px;margin:auto;">
            <h2 style="color:#FFB800;margin:0 0 16px;">Bienvenue, ${artisan.business_name}!</h2>
            <p style="color:rgba(255,255,255,0.8);line-height:1.6;">Votre accès Élite est désormais actif. Vous pouvez accéder à votre espace professionnel à tout moment.</p>
            <p style="margin:20px 0;"><a href="https://verified-craftsmen-hub.lovable.app/connexion" style="display:inline-block;background:#FFB800;color:#001529;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;">ACCÉDER À MON ESPACE →</a></p>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;">Identifiant : ${email}<br>Mot de passe : ${tempPassword}</p>
          </div>`,
        }),
      }).catch(e => console.error("[activate-silent] Email error:", e));
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: "created",
        email: email,
        token: token,
        artisan_id: artisan.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[activate-silent] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
