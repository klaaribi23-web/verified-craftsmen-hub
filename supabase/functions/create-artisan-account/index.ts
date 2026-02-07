import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check - verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claimsData.claims.sub as string;

    // Verify admin role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { email, password, firstName, lastName, artisanId } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[create-artisan-account] Creating account for: ${email}, artisanId: ${artisanId}`);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Un compte existe déjà avec cet email", user_id: existingUser.id }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create auth user
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
    console.log("Created auth user:", newUserId);

    // 2. Wait for trigger-created profile
    let profileId: string | null = null;
    for (let i = 0; i < 5; i++) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", newUserId)
        .single();
      if (profile) {
        profileId = profile.id;
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    if (!profileId) {
      console.error("Profile not created by trigger after 2.5s");
    }

    // 3. Link artisan record if provided
    if (artisanId) {
      const { error: linkError } = await supabaseAdmin
        .from("artisans")
        .update({
          user_id: newUserId,
          profile_id: profileId,
          status: "active",
          is_verified: true,
        })
        .eq("id", artisanId);

      if (linkError) {
        console.error("Error linking artisan:", linkError);
      } else {
        console.log("Linked artisan", artisanId, "to user", newUserId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        profile_id: profileId,
        message: "Compte artisan créé avec succès",
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
