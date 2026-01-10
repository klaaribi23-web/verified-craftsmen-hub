import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Static pages configuration
const staticPages = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/trouver-artisan', priority: '0.9', changefreq: 'daily' },
  { loc: '/nos-missions', priority: '0.9', changefreq: 'daily' },
  { loc: '/demande-devis', priority: '0.9', changefreq: 'monthly' },
  { loc: '/comment-ca-marche', priority: '0.8', changefreq: 'monthly' },
  { loc: '/devenir-artisan', priority: '0.8', changefreq: 'monthly' },
  { loc: '/a-propos', priority: '0.7', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
  { loc: '/blog', priority: '0.8', changefreq: 'weekly' },
  { loc: '/blog/comment-choisir-artisan-qualifie', priority: '0.7', changefreq: 'monthly' },
  { loc: '/blog/renovation-energetique-aides-2024', priority: '0.7', changefreq: 'monthly' },
  { loc: '/blog/trouver-artisan-plombier-electricien-macon', priority: '0.7', changefreq: 'monthly' },
]

const BASE_URL = 'https://artisansvalides.fr'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Fetch all public artisans (active and prospect with public profiles)
    const { data: artisans, error } = await supabase
      .from('public_artisans')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching artisans:', error)
      throw error
    }

    const today = new Date().toISOString().split('T')[0]

    // Build XML sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    // Add static pages
    for (const page of staticPages) {
      xml += '  <url>\n'
      xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`
      xml += `    <lastmod>${today}</lastmod>\n`
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`
      xml += `    <priority>${page.priority}</priority>\n`
      xml += '  </url>\n'
    }

    // Add artisan profiles
    if (artisans && artisans.length > 0) {
      for (const artisan of artisans) {
        if (artisan.slug) {
          const lastmod = artisan.updated_at 
            ? new Date(artisan.updated_at).toISOString().split('T')[0]
            : today
          
          xml += '  <url>\n'
          xml += `    <loc>${BASE_URL}/artisan/${artisan.slug}</loc>\n`
          xml += `    <lastmod>${lastmod}</lastmod>\n`
          xml += `    <changefreq>weekly</changefreq>\n`
          xml += `    <priority>0.8</priority>\n`
          xml += '  </url>\n'
        }
      }
    }

    xml += '</urlset>'

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml; charset=utf-8',
        },
      }
    )
  }
})
