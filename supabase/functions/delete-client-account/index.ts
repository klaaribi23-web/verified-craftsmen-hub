import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[DELETE-CLIENT] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting client account deletion process");

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Auth error", userError);
      throw new Error("Invalid authentication");
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;
    logStep("User authenticated", { userId, email: userEmail });

    // Verify user is a client
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (userRole?.role !== "client") {
      logStep("Role check failed", { role: userRole?.role });
      throw new Error("Cette fonction est réservée aux clients");
    }
    logStep("User role verified", { role: userRole.role });

    // Get profile - use maybeSingle to handle case where profile doesn't exist
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("user_id", userId)
      .maybeSingle();

    const profileId = profile?.id;
    logStep("Profile lookup", { profileId: profileId || "NOT FOUND - continuing anyway" });

    // ========== STORAGE CLEANUP ==========
    
    // Delete message attachments from storage if profile exists
    if (profileId) {
      try {
        const { data: messages } = await supabaseAdmin
          .from("messages")
          .select("attachment_url")
          .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
          .not("attachment_url", "is", null);
        
        if (messages && messages.length > 0) {
          const attachmentPaths = messages
            .map(m => {
              if (!m.attachment_url) return null;
              const match = m.attachment_url.match(/message-attachments\/(.+)$/);
              return match ? match[1] : null;
            })
            .filter(Boolean) as string[];
          
          if (attachmentPaths.length > 0) {
            await supabaseAdmin.storage.from("message-attachments").remove(attachmentPaths);
            logStep("Deleted message attachments", { count: attachmentPaths.length });
          }
        }
      } catch (storageError) {
        logStep("Message attachments cleanup skipped", { error: (storageError as Error).message });
      }
    }

    // ========== DATABASE CLEANUP ==========
    // Delete all related data in order (respect foreign keys)

    if (profileId) {
      // 1. Delete quotes where client is involved
      logStep("Deleting quotes");
      await supabaseAdmin
        .from("quotes")
        .delete()
        .eq("client_id", profileId);

      // 2. Delete mission applications (for missions owned by client)
      logStep("Deleting mission applications");
      const { data: clientMissions } = await supabaseAdmin
        .from("missions")
        .select("id")
        .eq("client_id", profileId);
      
      if (clientMissions && clientMissions.length > 0) {
        const missionIds = clientMissions.map(m => m.id);
        await supabaseAdmin
          .from("mission_applications")
          .delete()
          .in("mission_id", missionIds);
      }

      // 3. Delete missions
      logStep("Deleting missions");
      await supabaseAdmin
        .from("missions")
        .delete()
        .eq("client_id", profileId);

      // 4. Delete reviews by client
      logStep("Deleting reviews");
      await supabaseAdmin
        .from("reviews")
        .delete()
        .eq("client_id", profileId);

      // 5. Delete recommendations by client
      logStep("Deleting recommendations");
      await supabaseAdmin
        .from("recommendations")
        .delete()
        .eq("client_id", profileId);

      // 6. Delete client favorites
      logStep("Deleting favorites");
      await supabaseAdmin
        .from("client_favorites")
        .delete()
        .eq("client_id", profileId);

      // 7. Delete messages (sent and received)
      logStep("Deleting messages");
      await supabaseAdmin
        .from("messages")
        .delete()
        .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`);

      // 8. Delete conversation archives
      logStep("Deleting conversation archives");
      await supabaseAdmin
        .from("conversation_archives")
        .delete()
        .or(`user_profile_id.eq.${profileId},participant_id.eq.${profileId}`);
    }

    // 9. Delete notifications
    logStep("Deleting notifications");
    await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    // 10. Delete user devices
    logStep("Deleting user devices");
    await supabaseAdmin
      .from("user_devices")
      .delete()
      .eq("user_id", userId);

    // 11. Delete security logs
    logStep("Deleting security logs");
    await supabaseAdmin
      .from("security_logs")
      .delete()
      .eq("user_id", userId);

    // 12. Delete profile
    if (profileId) {
      logStep("Deleting profile");
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", profileId);
    }

    // 13. Delete user role
    logStep("Deleting user role");
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // 14. Delete auth user
    logStep("Deleting auth user");
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      logStep("Error deleting auth user", deleteAuthError);
      // Don't throw - the data is already deleted
    }

    logStep("Client account deletion completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Votre compte a été supprimé avec succès. Toutes vos données ont été effacées."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    logStep("Error in delete-client-account", { error: error.message });
    return new Response(
      JSON.stringify({
        success: false,
        error: "deletion_failed",
        message: error.message || "Erreur lors de la suppression du compte"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
