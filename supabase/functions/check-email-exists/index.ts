import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, activation_token } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // If activation_token is provided, verify it first to prevent abuse
    if (activation_token) {
      const { data: artisan, error: artisanError } = await supabaseAdmin
        .from('artisans')
        .select('id, email')
        .eq('activation_token', activation_token)
        .maybeSingle()

      if (artisanError || !artisan || artisan.email?.toLowerCase() !== email.toLowerCase()) {
        return new Response(
          JSON.stringify({ exists: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Check if user exists in auth.users
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('Error listing users:', usersError)
      return new Response(
        JSON.stringify({ exists: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const existingUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!existingUser) {
      return new Response(
        JSON.stringify({ exists: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only return role info if called with a valid activation_token
    // This prevents unauthenticated email enumeration + role disclosure
    if (activation_token) {
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', existingUser.id)
        .maybeSingle()

      return new Response(
        JSON.stringify({
          exists: true,
          role: roleData?.role || null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Without activation_token, only return exists (no role, no userId)
    return new Response(
      JSON.stringify({ exists: true }),
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
