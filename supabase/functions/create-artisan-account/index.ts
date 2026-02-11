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
    const body = await req.json();
    const { email, password, firstName, lastName, artisanId } = body;
    
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    // Auth: service role header OR admin user token
    const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
    
    if (!isServiceRole) {
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

      const callerUserId = claimsData.claims.sub as string;

      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", callerUserId)
        .single();

      if (roleData?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
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
      
      // Clean up DB tables first
      await supabaseAdmin.from("user_roles").delete().eq("user_id", existingUser.id);
      await supabaseAdmin.from("profiles").delete().eq("user_id", existingUser.id);
      await supabaseAdmin.from("artisans").update({ user_id: null, profile_id: null }).eq("user_id", existingUser.id);
      
      // Delete auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error("Error deleting existing user:", deleteError);
        throw new Error(`Impossible de supprimer l'ancien compte: ${deleteError.message}`);
      }
      console.log(`[create-artisan-account] Old user deleted successfully`);
      
      // Small delay for consistency
      await new Promise(r => setTimeout(r, 500));
    }

    // Step 1: Create auth user with artisan role
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

    // Fallback: create manually if triggers didn't fire
    if (!profileId) {
      console.log("[create-artisan-account] Profile not created by trigger, inserting manually");
      const { data: newProfile } = await supabaseAdmin.from("profiles").insert({
        user_id: newUserId,
        email,
        first_name: firstName || "Artisan",
        last_name: lastName || "",
        email_confirmed: true,
      }).select("id").single();
      profileId = newProfile?.id || null;
    }

    // Always force email_confirmed = true for admin-created accounts
    if (profileId) {
      await supabaseAdmin.from("profiles").update({ email_confirmed: true }).eq("user_id", newUserId);
    }

    if (!roleCreated) {
      console.log("[create-artisan-account] Role not created by trigger, inserting manually as artisan");
      await supabaseAdmin.from("user_roles").insert({
        user_id: newUserId,
        role: "artisan",
      });
    }

    // Step 3: Verify role is 'artisan' (fix if trigger defaulted to 'client')
    const { data: currentRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", newUserId)
      .single();
    
    if (currentRole?.role !== "artisan") {
      console.log(`[create-artisan-account] Role is '${currentRole?.role}', correcting to 'artisan'`);
      await supabaseAdmin
        .from("user_roles")
        .update({ role: "artisan" })
        .eq("user_id", newUserId);
    }

    // Step 4: Link artisan record if provided
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
        email,
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
