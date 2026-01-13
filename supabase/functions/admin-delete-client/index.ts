import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify admin status
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user from the token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is an admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Accès refusé - Admin requis" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the profile ID to delete from request body
    const { profileId } = await req.json();

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "ID du profil requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin ${user.email} is deleting client profile: ${profileId}`);

    // Fetch the profile to get user_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, email, first_name, last_name")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profil non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = profile.user_id;
    console.log(`Found profile for user_id: ${userId}, email: ${profile.email}`);

    // ============================================
    // DELETE ALL RELATED DATA IN ORDER
    // ============================================

    // 1. Delete client favorites
    const { error: favoritesError } = await supabaseAdmin
      .from("client_favorites")
      .delete()
      .eq("client_id", profileId);
    if (favoritesError) console.log("Error deleting favorites:", favoritesError.message);

    // 2. Delete quotes where client is involved
    const { error: quotesError } = await supabaseAdmin
      .from("quotes")
      .delete()
      .eq("client_id", profileId);
    if (quotesError) console.log("Error deleting quotes:", quotesError.message);

    // 3. Delete recommendations made by this client
    const { error: recommendationsError } = await supabaseAdmin
      .from("recommendations")
      .delete()
      .eq("client_id", profileId);
    if (recommendationsError) console.log("Error deleting recommendations:", recommendationsError.message);

    // 4. Delete reviews made by this client
    const { error: reviewsError } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("client_id", profileId);
    if (reviewsError) console.log("Error deleting reviews:", reviewsError.message);

    // 5. Delete mission applications for missions created by this client
    const { data: clientMissions } = await supabaseAdmin
      .from("missions")
      .select("id")
      .eq("client_id", profileId);

    if (clientMissions && clientMissions.length > 0) {
      const missionIds = clientMissions.map(m => m.id);
      const { error: applicationsError } = await supabaseAdmin
        .from("mission_applications")
        .delete()
        .in("mission_id", missionIds);
      if (applicationsError) console.log("Error deleting mission applications:", applicationsError.message);
    }

    // 6. Delete missions created by this client
    const { error: missionsError } = await supabaseAdmin
      .from("missions")
      .delete()
      .eq("client_id", profileId);
    if (missionsError) console.log("Error deleting missions:", missionsError.message);

    // 7. Delete messages sent or received by this profile
    const { error: messagesSentError } = await supabaseAdmin
      .from("messages")
      .delete()
      .eq("sender_id", profileId);
    if (messagesSentError) console.log("Error deleting sent messages:", messagesSentError.message);

    const { error: messagesReceivedError } = await supabaseAdmin
      .from("messages")
      .delete()
      .eq("receiver_id", profileId);
    if (messagesReceivedError) console.log("Error deleting received messages:", messagesReceivedError.message);

    // 8. Delete conversation archives
    const { error: archivesError1 } = await supabaseAdmin
      .from("conversation_archives")
      .delete()
      .eq("user_profile_id", profileId);
    if (archivesError1) console.log("Error deleting archives 1:", archivesError1.message);

    const { error: archivesError2 } = await supabaseAdmin
      .from("conversation_archives")
      .delete()
      .eq("participant_id", profileId);
    if (archivesError2) console.log("Error deleting archives 2:", archivesError2.message);

    // 9. Delete notifications for this user
    const { error: notificationsError } = await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("user_id", userId);
    if (notificationsError) console.log("Error deleting notifications:", notificationsError.message);

    // 10. Delete user devices
    const { error: devicesError } = await supabaseAdmin
      .from("user_devices")
      .delete()
      .eq("user_id", userId);
    if (devicesError) console.log("Error deleting devices:", devicesError.message);

    // 11. Delete user roles
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (rolesError) console.log("Error deleting roles:", rolesError.message);

    // 12. Delete the profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", profileId);
    if (profileDeleteError) {
      console.error("Error deleting profile:", profileDeleteError.message);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la suppression du profil" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 13. Delete the auth user (this is the final step)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError.message);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la suppression du compte auth" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted client: ${profile.email} (profile: ${profileId}, user: ${userId})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Client supprimé complètement",
        deletedProfileId: profileId,
        deletedUserId: userId,
        deletedEmail: profile.email,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in admin-delete-client:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur serveur";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
