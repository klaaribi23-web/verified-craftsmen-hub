import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting expired stories cleanup...')

    // Get all expired stories
    const { data: expiredStories, error: fetchError } = await supabase
      .from('artisan_stories')
      .select('id, media_url, artisan_id')
      .lt('expires_at', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching expired stories:', fetchError)
      throw fetchError
    }

    console.log(`Found ${expiredStories?.length || 0} expired stories to clean up`)

    if (!expiredStories || expiredStories.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired stories to clean up', deleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let deletedCount = 0
    const errors: string[] = []

    for (const story of expiredStories) {
      try {
        // Extract file path from media_url
        const urlParts = story.media_url.split('/artisan-stories/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          
          // Delete file from storage
          const { error: storageError } = await supabase.storage
            .from('artisan-stories')
            .remove([filePath])

          if (storageError) {
            console.warn(`Warning: Could not delete file ${filePath}:`, storageError.message)
          } else {
            console.log(`Deleted file: ${filePath}`)
          }
        }

        // Delete story record from database
        const { error: deleteError } = await supabase
          .from('artisan_stories')
          .delete()
          .eq('id', story.id)

        if (deleteError) {
          console.error(`Error deleting story ${story.id}:`, deleteError)
          errors.push(`Story ${story.id}: ${deleteError.message}`)
        } else {
          deletedCount++
          console.log(`Deleted story record: ${story.id}`)
        }

        // Also delete related story_views
        await supabase
          .from('story_views')
          .delete()
          .eq('story_id', story.id)

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`Error processing story ${story.id}:`, err)
        errors.push(`Story ${story.id}: ${errorMessage}`)
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} stories.`)

    return new Response(
      JSON.stringify({
        message: 'Cleanup completed',
        deleted: deletedCount,
        total: expiredStories.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
