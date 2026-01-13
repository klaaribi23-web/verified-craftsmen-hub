import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { artisanId } = await req.json()

    if (!artisanId) {
      return new Response(
        JSON.stringify({ error: 'artisanId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify the caller is an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError || roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get artisan data before deletion
    const { data: artisan, error: artisanError } = await supabaseAdmin
      .from('artisans')
      .select('id, email, user_id, profile_id, status')
      .eq('id', artisanId)
      .maybeSingle()

    if (artisanError) {
      console.error('Error fetching artisan:', artisanError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch artisan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!artisan) {
      return new Response(
        JSON.stringify({ error: 'Artisan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Deleting artisan:', artisan.id, 'email:', artisan.email, 'user_id:', artisan.user_id)

    // Delete all associated data
    const deletePromises = [
      supabaseAdmin.from('artisan_categories').delete().eq('artisan_id', artisanId),
      supabaseAdmin.from('artisan_services').delete().eq('artisan_id', artisanId),
      supabaseAdmin.from('artisan_stories').delete().eq('artisan_id', artisanId),
      supabaseAdmin.from('artisan_documents').delete().eq('artisan_id', artisanId),
      supabaseAdmin.from('recommendations').delete().eq('artisan_id', artisanId),
      supabaseAdmin.from('reviews').delete().eq('artisan_id', artisanId),
      supabaseAdmin.from('client_favorites').delete().eq('artisan_id', artisanId),
      supabaseAdmin.from('quotes').delete().eq('artisan_id', artisanId),
    ]

    await Promise.all(deletePromises)

    // Delete the artisan record
    const { error: deleteArtisanError } = await supabaseAdmin
      .from('artisans')
      .delete()
      .eq('id', artisanId)

    if (deleteArtisanError) {
      console.error('Error deleting artisan:', deleteArtisanError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete artisan record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Now handle the user account cleanup
    let userIdToDelete: string | null = artisan.user_id

    // If no user_id linked, check for orphan user by email
    if (!userIdToDelete && artisan.email) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
      const orphanUser = usersData?.users?.find(
        u => u.email?.toLowerCase() === artisan.email?.toLowerCase()
      )

      if (orphanUser) {
        // Check if this user is linked to ANY artisan (not just the deleted one)
        const { data: linkedArtisans } = await supabaseAdmin
          .from('artisans')
          .select('id')
          .eq('user_id', orphanUser.id)
          .limit(1)

        // Only delete if no artisan is linked to this user
        if (!linkedArtisans || linkedArtisans.length === 0) {
          // Check the user's role
          const { data: userRole } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', orphanUser.id)
            .maybeSingle()

          // Only delete if role is 'artisan' (not admin or client with important data)
          if (userRole?.role === 'artisan') {
            userIdToDelete = orphanUser.id
            console.log('Found orphan artisan user to delete:', orphanUser.id, orphanUser.email)
          }
        }
      }
    }

    // Delete user account and related data if applicable
    if (userIdToDelete) {
      console.log('Cleaning up user account:', userIdToDelete)

      // Delete user_roles
      await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userIdToDelete)

      // Delete profile if exists
      if (artisan.profile_id) {
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', artisan.profile_id)
      } else {
        // Try to delete profile by user_id
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', userIdToDelete)
      }

      // Delete notifications for this user
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', userIdToDelete)

      // Delete the auth user
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)
      
      if (deleteUserError) {
        console.error('Error deleting auth user:', deleteUserError)
        // Don't fail the whole operation, just log
      } else {
        console.log('Successfully deleted auth user:', userIdToDelete)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedArtisan: artisanId,
        deletedUser: userIdToDelete || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
