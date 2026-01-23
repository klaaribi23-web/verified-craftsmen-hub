import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[DELETE-ARTISAN] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting account deletion process");

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

    // Verify user is an artisan
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (userRole?.role !== "artisan") {
      logStep("Role check failed", { role: userRole?.role });
      throw new Error("Cette fonction est réservée aux artisans");
    }
    logStep("User role verified", { role: userRole.role });

    // Get artisan record - search by user_id first, then by email
    let artisan = null;

    // First try by user_id
    const { data: artisanByUser } = await supabaseAdmin
      .from("artisans")
      .select("id, stripe_customer_id, subscription_tier, business_name, email, user_id, profile_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (artisanByUser) {
      artisan = artisanByUser;
      logStep("Artisan found by user_id", { artisanId: artisan.id });
    } else if (userEmail) {
      // Try by email for partially activated artisans
      const { data: artisanByEmail } = await supabaseAdmin
        .from("artisans")
        .select("id, stripe_customer_id, subscription_tier, business_name, email, user_id, profile_id")
        .eq("email", userEmail)
        .maybeSingle();
      
      if (artisanByEmail) {
        artisan = artisanByEmail;
        logStep("Artisan found by email", { artisanId: artisan.id });
      }
    }

    if (!artisan) {
      logStep("No artisan found", { userId, email: userEmail });
      throw new Error("Aucun profil artisan trouvé pour ce compte. Vérifiez que vous êtes bien connecté avec le bon compte.");
    }

    logStep("Artisan found", { artisanId: artisan.id, tier: artisan.subscription_tier });

    // Check Stripe subscription status
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey && artisan.stripe_customer_id) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      
      // Check for active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: artisan.stripe_customer_id,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        logStep("Active subscription found - blocking deletion");
        return new Response(
          JSON.stringify({
            success: false,
            error: "active_subscription",
            message: "Vous avez un abonnement actif. Veuillez d'abord annuler votre abonnement via le portail Stripe avant de supprimer votre compte."
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
      logStep("No active Stripe subscription found - proceeding");
    } else if (artisan.subscription_tier && artisan.subscription_tier !== "free") {
      // Double check: if tier is not free but no stripe customer, still block
      logStep("Non-free tier without Stripe customer - checking database");
      const { data: artisanDetails } = await supabaseAdmin
        .from("artisans")
        .select("subscription_end")
        .eq("id", artisan.id)
        .single();
      
      if (artisanDetails?.subscription_end) {
        const endDate = new Date(artisanDetails.subscription_end);
        if (endDate > new Date()) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "active_subscription",
              message: "Vous avez un abonnement actif. Veuillez d'abord annuler votre abonnement avant de supprimer votre compte."
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }
    }

    const artisanId = artisan.id;
    logStep("Starting data deletion for artisan", { artisanId });

    // Get profile ID (may be null for imported artisans)
    let profileId = artisan.profile_id;
    if (!profileId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      profileId = profile?.id;
    }
    logStep("Profile lookup", { profileId: profileId || "NOT FOUND" });

    // ========== STORAGE CLEANUP ==========
    
    // Delete portfolio files from storage
    try {
      const { data: portfolioFiles } = await supabaseAdmin.storage
        .from("artisan-portfolios")
        .list(`${artisanId}/`);
      
      if (portfolioFiles && portfolioFiles.length > 0) {
        const filePaths = portfolioFiles.map(f => `${artisanId}/${f.name}`);
        await supabaseAdmin.storage.from("artisan-portfolios").remove(filePaths);
        logStep("Deleted portfolio files", { count: filePaths.length });
      }
    } catch (storageError) {
      logStep("Portfolio storage cleanup skipped", { error: (storageError as Error).message });
    }

    // Delete documents from storage
    try {
      const { data: docRecords } = await supabaseAdmin
        .from("artisan_documents")
        .select("file_path")
        .eq("artisan_id", artisanId);
      
      if (docRecords && docRecords.length > 0) {
        const docPaths = docRecords.map(d => d.file_path).filter(Boolean);
        if (docPaths.length > 0) {
          await supabaseAdmin.storage.from("artisan-documents").remove(docPaths);
          logStep("Deleted document files", { count: docPaths.length });
        }
      }
    } catch (storageError) {
      logStep("Documents storage cleanup skipped", { error: (storageError as Error).message });
    }

    // Delete stories media from storage
    try {
      const { data: storyRecords } = await supabaseAdmin
        .from("artisan_stories")
        .select("media_url")
        .eq("artisan_id", artisanId);
      
      if (storyRecords && storyRecords.length > 0) {
        const storyPaths = storyRecords
          .map(s => {
            if (!s.media_url) return null;
            const match = s.media_url.match(/artisan-stories\/(.+)$/);
            return match ? match[1] : null;
          })
          .filter(Boolean) as string[];
        
        if (storyPaths.length > 0) {
          await supabaseAdmin.storage.from("artisan-stories").remove(storyPaths);
          logStep("Deleted story files", { count: storyPaths.length });
        }
      }
    } catch (storageError) {
      logStep("Stories storage cleanup skipped", { error: (storageError as Error).message });
    }

    // ========== DATABASE CLEANUP ==========
    // Delete all related data in order (respect foreign keys)
    
    // 1. Delete story views
    logStep("Deleting story views");
    const { data: stories } = await supabaseAdmin
      .from("artisan_stories")
      .select("id")
      .eq("artisan_id", artisanId);
    
    if (stories && stories.length > 0) {
      const storyIds = stories.map(s => s.id);
      await supabaseAdmin
        .from("story_views")
        .delete()
        .in("story_id", storyIds);
    }

    // 2. Delete artisan stories
    logStep("Deleting artisan stories");
    await supabaseAdmin
      .from("artisan_stories")
      .delete()
      .eq("artisan_id", artisanId);

    // 3. Delete artisan categories
    logStep("Deleting artisan categories");
    await supabaseAdmin
      .from("artisan_categories")
      .delete()
      .eq("artisan_id", artisanId);

    // 4. Delete artisan services
    logStep("Deleting artisan services");
    await supabaseAdmin
      .from("artisan_services")
      .delete()
      .eq("artisan_id", artisanId);

    // 5. Delete artisan documents
    logStep("Deleting artisan documents");
    await supabaseAdmin
      .from("artisan_documents")
      .delete()
      .eq("artisan_id", artisanId);

    // 6. Delete recommendations (as artisan)
    logStep("Deleting recommendations");
    await supabaseAdmin
      .from("recommendations")
      .delete()
      .eq("artisan_id", artisanId);

    // 7. Delete reviews (as artisan)
    logStep("Deleting reviews");
    await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("artisan_id", artisanId);

    // 8. Delete quotes
    logStep("Deleting quotes");
    await supabaseAdmin
      .from("quotes")
      .delete()
      .eq("artisan_id", artisanId);

    // 9. Delete mission applications
    logStep("Deleting mission applications");
    await supabaseAdmin
      .from("mission_applications")
      .delete()
      .eq("artisan_id", artisanId);

    // 10. Update missions (remove assigned artisan)
    logStep("Updating missions");
    await supabaseAdmin
      .from("missions")
      .update({ assigned_artisan_id: null })
      .eq("assigned_artisan_id", artisanId);

    // 11. Delete client favorites (where artisan was favorited)
    logStep("Deleting client favorites");
    await supabaseAdmin
      .from("client_favorites")
      .delete()
      .eq("artisan_id", artisanId);

    if (profileId) {
      // 12. Delete messages (sent and received)
      logStep("Deleting messages");
      await supabaseAdmin
        .from("messages")
        .delete()
        .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`);

      // 13. Delete conversation archives
      logStep("Deleting conversation archives");
      await supabaseAdmin
        .from("conversation_archives")
        .delete()
        .or(`user_profile_id.eq.${profileId},participant_id.eq.${profileId}`);
    }

    // 14. Delete notifications
    logStep("Deleting notifications");
    await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    // 15. Delete user devices
    logStep("Deleting user devices");
    await supabaseAdmin
      .from("user_devices")
      .delete()
      .eq("user_id", userId);

    // 16. Delete security logs
    logStep("Deleting security logs");
    await supabaseAdmin
      .from("security_logs")
      .delete()
      .eq("user_id", userId);

    // 17. Delete artisan record
    logStep("Deleting artisan record");
    await supabaseAdmin
      .from("artisans")
      .delete()
      .eq("id", artisanId);

    // 18. Delete profile
    if (profileId) {
      logStep("Deleting profile");
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", profileId);
    }

    // 19. Delete user role
    logStep("Deleting user role");
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // 20. Delete auth user (using admin API)
    logStep("Deleting auth user");
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      logStep("Error deleting auth user", deleteAuthError);
      // Don't throw - the data is already deleted
    }

    logStep("Account deletion completed successfully");

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
    logStep("Error in delete-artisan-account", { error: error.message });
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
