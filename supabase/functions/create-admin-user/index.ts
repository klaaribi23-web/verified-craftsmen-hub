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

    const newEmail = "k.laaribi23@gmail.com";
    const oldEmail = "k.laaribi@gmail.com";
    const password = "LaaribiSeville1978*...";

    // Step 1: Remove old admin if exists
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    const oldUser = allUsers?.users?.find(u => u.email === oldEmail);
    if (oldUser) {
      // Remove role
      await supabaseAdmin.from("user_roles").delete().eq("user_id", oldUser.id);
      // Remove profile
      await supabaseAdmin.from("profiles").delete().eq("user_id", oldUser.id);
      // Delete auth user
      await supabaseAdmin.auth.admin.deleteUser(oldUser.id);
      console.log("Old admin deleted:", oldEmail);
    }

    const email = newEmail;

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      return new Response(
        JSON.stringify({ message: "Admin already exists", user_id: existingUser.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: "Admin",
        last_name: "Test",
        user_type: "admin",
      },
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // Wait for profile trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Set email_confirmed in profiles
    await supabaseAdmin
      .from("profiles")
      .update({ email_confirmed: true })
      .eq("user_id", userId);

    // Fix role to admin (trigger sets it based on user_type)
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingRole) {
      await supabaseAdmin
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", userId);
    } else {
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
    }

    return new Response(
      JSON.stringify({ success: true, email, user_id: userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
