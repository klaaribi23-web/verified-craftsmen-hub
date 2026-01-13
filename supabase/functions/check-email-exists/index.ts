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
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client to access auth.users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Check if user exists in auth.users
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error listing users:', usersError)
      return new Response(
        JSON.stringify({ exists: false, role: null, userId: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const existingUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!existingUser) {
      return new Response(
        JSON.stringify({ exists: false, role: null, userId: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', existingUser.id)
      .maybeSingle()

    if (roleError) {
      console.error('Error fetching role:', roleError)
    }

    return new Response(
      JSON.stringify({
        exists: true,
        role: roleData?.role || null,
        userId: existingUser.id
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
