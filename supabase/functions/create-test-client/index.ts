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

    const email = "client@test.fr";
    const password = "Client2026!";

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      const userId = existingUser.id;

      // Try to update existing profile
      let { data: profile } = await supabaseAdmin
        .from("profiles")
        .update({
          email_confirmed: true,
          first_name: "Marie",
          last_name: "Dupont",
          city: "Lille",
        })
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

      // If no profile exists, create one
      if (!profile) {
        const { data: newProfile, error: insertError } = await supabaseAdmin
          .from("profiles")
          .insert({
            user_id: userId,
            email: email,
            email_confirmed: true,
            first_name: "Marie",
            last_name: "Dupont",
            city: "Lille",
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Profile insert error:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to create profile: " + insertError.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
        profile = newProfile;
      }

      // Ensure role is client
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id, role")
        .eq("user_id", userId)
        .single();

      if (!existingRole) {
        await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "client" });
      } else if (existingRole.role !== "client") {
        await supabaseAdmin.from("user_roles").update({ role: "client" }).eq("user_id", userId);
      }

      // Check if mission already exists
      const { data: existingMissions } = await supabaseAdmin
        .from("missions")
        .select("id")
        .eq("client_id", profile.id)
        .ilike("title", "%Suite Parentale%");

      if (!existingMissions || existingMissions.length === 0) {
        // Get category
        const { data: categories } = await supabaseAdmin.from("categories").select("id, name").limit(10);
        const plomberieCategory = categories?.find(c => c.name.toLowerCase().includes("plomberie") || c.name.toLowerCase().includes("salle de bain"));
        const categoryId = plomberieCategory?.id || categories?.[0]?.id || null;

        await supabaseAdmin.from("missions").insert({
          title: "Rénovation complète Suite Parentale (35m²)",
          description: "Rénovation complète de la suite parentale incluant : dépose carrelage, douche à l'italienne, double vasque, peinture hydrofuge et éclairage LED.",
          client_id: profile.id,
          city: "Lille",
          address: "59000 Lille",
          budget: 15000,
          category_id: categoryId,
          status: "published",
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Client updated with mission", user_id: userId, profile_id: profile.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: "Marie",
        last_name: "Dupont",
        user_type: "client",
      },
    });

    if (authError) throw authError;

    const userId = authData.user.id;
    console.log("Created auth user:", userId);

    // Wait for profile trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Set email_confirmed in profiles and update name/city
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        email_confirmed: true,
        first_name: "Marie",
        last_name: "Dupont",
        city: "Lille",
        phone: "06 12 34 56 78",
      })
      .eq("user_id", userId)
      .select("id")
      .single();

    if (profileError) {
      console.error("Profile update error:", profileError);
      throw profileError;
    }

    console.log("Profile ID:", profile.id);

    // 3. Ensure role is client
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id, role")
      .eq("user_id", userId)
      .single();

    if (existingRole && existingRole.role !== "client") {
      await supabaseAdmin
        .from("user_roles")
        .update({ role: "client" })
        .eq("user_id", userId);
    } else if (!existingRole) {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "client" });
    }

    // 4. Get a category for the mission (plomberie or first available)
    const { data: categories } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .limit(10);

    const plomberieCategory = categories?.find(c => 
      c.name.toLowerCase().includes("plomberie") || c.name.toLowerCase().includes("salle de bain")
    );
    const categoryId = plomberieCategory?.id || categories?.[0]?.id || null;

    // 5. Create the mission "Rénovation Suite Parentale"
    const { data: mission, error: missionError } = await supabaseAdmin
      .from("missions")
      .insert({
        title: "Rénovation complète Suite Parentale (35m²)",
        description: "Rénovation complète de la suite parentale de 35m² incluant : dépose de l'ancien carrelage, création d'une douche à l'italienne avec receveur extra-plat, pose de double vasque et robinetterie encastrée, peinture hydrofuge et éclairage LED intégré. Budget estimé : 12 000 € — 15 000 €.",
        client_id: profile.id,
        city: "Lille",
        address: "59000 Lille",
        budget: 15000,
        category_id: categoryId,
        status: "published",
      })
      .select("id")
      .single();

    if (missionError) {
      console.error("Mission error:", missionError);
      // Don't throw - account is created even if mission fails
    }

    console.log("Mission created:", mission?.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test client account created with demo mission",
        email,
        user_id: userId,
        profile_id: profile.id,
        mission_id: mission?.id || null,
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
