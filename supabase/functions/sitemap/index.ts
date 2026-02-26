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
  { loc: '/artisans', priority: '0.9', changefreq: 'weekly' },
]

// Blog articles - synchronized with src/data/blogArticles.tsx
const blogArticles = [
  { slug: 'comment-choisir-artisan-qualifie', date: '2024-12-20' },
  { slug: 'renovation-energetique-aides-2024', date: '2024-12-15' },
  { slug: 'plombier-electricien-maçon-trouver-artisan', date: '2024-12-10' },
]

const BASE_URL = 'https://artisansvalides.fr'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Fetch artisans, SEO cities, and SEO metiers in parallel
    const [artisansRes, citiesRes, metiersRes] = await Promise.all([
      supabase.from('public_artisans').select('slug, updated_at').order('updated_at', { ascending: false }),
      supabase.from('seo_cities').select('slug').eq('is_active', true),
      supabase.from('seo_metiers').select('slug').eq('is_active', true),
    ])

    if (artisansRes.error) throw artisansRes.error

    const artisans = artisansRes.data
    const cities = citiesRes.data || []
    const metiers = metiersRes.data || []

    const today = new Date().toISOString().split('T')[0]

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n    <loc>${BASE_URL}${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`
    }

    // Blog articles
    for (const article of blogArticles) {
      xml += `  <url>\n    <loc>${BASE_URL}/blog/${article.slug}</loc>\n    <lastmod>${article.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`
    }

    // Artisan profiles
    if (artisans && artisans.length > 0) {
      for (const artisan of artisans) {
        if (artisan.slug) {
          const lastmod = artisan.updated_at 
            ? new Date(artisan.updated_at).toISOString().split('T')[0]
            : today
          xml += `  <url>\n    <loc>${BASE_URL}/artisan/${artisan.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
        }
      }
    }

    // SEO programmatic pages: metier × ville combinations
    for (const metier of metiers) {
      for (const city of cities) {
        xml += `  <url>\n    <loc>${BASE_URL}/artisans/${metier.slug}-${city.slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`
      }
    }

    xml += '</urlset>'

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
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
