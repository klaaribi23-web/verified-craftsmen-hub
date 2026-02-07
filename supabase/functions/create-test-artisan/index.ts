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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "pro@test.fr";
    const password = "Artisan2026!";

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      return new Response(
        JSON.stringify({ message: "User already exists", user_id: existingUser.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: "Artisan",
        last_name: "Test",
        user_type: "artisan",
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw authError;
    }

    const userId = authData.user.id;
    console.log("Created auth user:", userId);

    // 2. Get the profile that was auto-created by the trigger
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      throw new Error("Profile not created by trigger");
    }

    console.log("Profile ID:", profile.id);

    // 3. Create the artisan record
    const { data: artisan, error: artisanError } = await supabaseAdmin
      .from("artisans")
      .insert({
        business_name: "Entreprise Test Pro",
        city: "Lille",
        user_id: userId,
        profile_id: profile.id,
        status: "active",
        phone: "06 00 00 00 00",
        email: email,
        description: "Artisan de test pour la démo",
        experience_years: 10,
        is_verified: true,
      })
      .select("id")
      .single();

    if (artisanError) {
      console.error("Artisan error:", artisanError);
      throw artisanError;
    }

    console.log("Created artisan:", artisan.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test artisan account created successfully",
        email,
        user_id: userId,
        profile_id: profile.id,
        artisan_id: artisan.id,
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
