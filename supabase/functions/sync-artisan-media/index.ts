import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_IMAGE_SIZE = 10000; // 10KB minimum to filter out icons/logos
const MAX_PHOTOS = 12;
const MAX_VIDEOS = 6;

/**
 * Extract image URLs from HTML content.
 * Filters out small images, icons, logos, and tracking pixels.
 */
function extractImageUrls(html: string, baseUrl: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)[^>]*>/gi;
  const bgRegex = /background(?:-image)?\s*:\s*url\(['"]?([^"')]+)['"]?\)/gi;
  const srcsetRegex = /srcset=["']([^"']+)[^']/gi;

  const urls = new Set<string>();

  // Extract from <img src>
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    urls.add(match[1]);
  }

  // Extract from CSS background-image
  while ((match = bgRegex.exec(html)) !== null) {
    urls.add(match[1]);
  }

  // Extract from srcset (take largest)
  while ((match = srcsetRegex.exec(html)) !== null) {
    const srcsetParts = match[1].split(",").map(s => s.trim().split(/\s+/)[0]);
    srcsetParts.forEach(url => urls.add(url));
  }

  // Resolve relative URLs and filter
  const resolved: string[] = [];
  for (const url of urls) {
    try {
      const fullUrl = new URL(url, baseUrl).href;
      
      // Skip data URIs, SVGs, tracking pixels, icons
      if (fullUrl.startsWith("data:")) continue;
      if (/\.(svg|ico|gif)(\?|$)/i.test(fullUrl)) continue;
      if (/favicon|logo|icon|pixel|tracking|analytics|badge|button|banner-ad/i.test(fullUrl)) continue;
      if (/1x1|spacer|blank|transparent/i.test(fullUrl)) continue;
      // Keep only common image formats
      if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(fullUrl) && !fullUrl.includes("/wp-content/uploads/")) continue;
      
      resolved.push(fullUrl);
    } catch {
      // Invalid URL, skip
    }
  }

  return resolved;
}

/**
 * Extract YouTube video URLs from HTML content.
 */
function extractYouTubeUrls(html: string): string[] {
  const urls = new Set<string>();

  // YouTube embed iframes
  const iframeRegex = /src=["'](https?:\/\/(?:www\.)?youtube\.com\/embed\/[^"'?]+)[^"']*/gi;
  let match;
  while ((match = iframeRegex.exec(html)) !== null) {
    urls.add(match[1]);
  }

  // YouTube links in href
  const hrefRegex = /href=["'](https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^"'&]+)[^"']*/gi;
  while ((match = hrefRegex.exec(html)) !== null) {
    urls.add(match[1]);
  }

  // Convert embed URLs to standard watch URLs
  const standardized: string[] = [];
  for (const url of urls) {
    const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
    if (embedMatch) {
      standardized.push(`https://www.youtube.com/watch?v=${embedMatch[1]}`);
    } else {
      standardized.push(url);
    }
  }

  return standardized;
}

/**
 * Check if an image is large enough (not an icon or tiny image).
 */
async function isImageLargeEnough(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) < MIN_IMAGE_SIZE) return false;

    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.startsWith("image/")) return false;
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate SEO description using AI.
 */
async function generateSeoDescription(businessName: string, metier: string, city: string, websiteContent: string): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  try {
    // Take first 2000 chars of text content for context
    const textContent = websiteContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 2000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en rédaction SEO pour artisans du bâtiment en France. Rédige une description professionnelle et convaincante.

Règles strictes :
- Maximum 300 caractères
- Français courant et professionnel
- Mots-clés SEO : "artisan certifié", "devis gratuit", "travaux de qualité"
- Mentionne la ville pour le référencement local
- Ton persuasif mais naturel
- Ne commence PAS par le nom de l'entreprise
- Pas de guillemets autour du texte
- Une ou deux phrases maximum`
          },
          {
            role: "user",
            content: `Rédige une description SEO pour cet artisan :
- Entreprise : ${businessName}
- Métier : ${metier}
- Ville : ${city}

Contenu de leur site web (pour contexte) :
${textContent}

La description doit refléter leurs spécialités réelles vues sur le site.`
          }
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Error generating SEO description:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check - admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { artisanId } = await req.json();
    if (!artisanId) {
      return new Response(JSON.stringify({ error: "artisanId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[sync-artisan-media] Starting sync for artisan: ${artisanId}`);

    // Fetch artisan data
    const { data: artisan, error: artisanError } = await supabase
      .from("artisans")
      .select("id, business_name, city, website_url, portfolio_images, portfolio_videos, description, category_id")
      .eq("id", artisanId)
      .single();

    if (artisanError || !artisan) {
      console.error("[sync-artisan-media] Artisan not found:", artisanError);
      return new Response(JSON.stringify({ error: "Artisan not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!artisan.website_url) {
      return new Response(JSON.stringify({ error: "Artisan has no website URL", photos: 0, videos: 0 }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Format URL
    let websiteUrl = artisan.website_url.trim();
    if (!websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) {
      websiteUrl = `https://${websiteUrl}`;
    }

    console.log(`[sync-artisan-media] Fetching website: ${websiteUrl}`);

    // Fetch the website HTML
    let html = "";
    try {
      const response = await fetch(websiteUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ArtisansValidesBot/1.0)",
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.error(`[sync-artisan-media] Website returned ${response.status}`);
        return new Response(JSON.stringify({ error: `Website returned ${response.status}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      html = await response.text();
    } catch (fetchError) {
      console.error("[sync-artisan-media] Error fetching website:", fetchError);
      return new Response(JSON.stringify({ error: "Could not reach website" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[sync-artisan-media] HTML length: ${html.length}`);

    // Extract images
    const imageUrls = extractImageUrls(html, websiteUrl);
    console.log(`[sync-artisan-media] Found ${imageUrls.length} candidate images`);

    // Validate images (check size) - limit parallel checks
    const existingPhotos = artisan.portfolio_images || [];
    const slotsAvailable = MAX_PHOTOS - existingPhotos.length;
    
    const validImages: string[] = [];
    if (slotsAvailable > 0) {
      // Check images in batches of 5
      for (let i = 0; i < imageUrls.length && validImages.length < slotsAvailable; i += 5) {
        const batch = imageUrls.slice(i, i + 5);
        const results = await Promise.all(batch.map(async url => {
          // Skip if already in portfolio
          if (existingPhotos.includes(url)) return null;
          const isValid = await isImageLargeEnough(url);
          return isValid ? url : null;
        }));
        validImages.push(...results.filter((url): url is string => url !== null));
      }
    }

    console.log(`[sync-artisan-media] Valid images: ${validImages.length}`);

    // Extract YouTube videos
    const existingVideos = artisan.portfolio_videos || [];
    const videoSlotsAvailable = MAX_VIDEOS - existingVideos.length;
    const youtubeUrls = extractYouTubeUrls(html);
    const newVideos = youtubeUrls
      .filter(url => !existingVideos.includes(url))
      .slice(0, videoSlotsAvailable);

    console.log(`[sync-artisan-media] New videos: ${newVideos.length}`);

    // Generate SEO description if missing or short
    let seoDescription: string | null = null;
    if (!artisan.description || artisan.description.length < 50) {
      // Get category name for context
      let metier = "artisan du bâtiment";
      if (artisan.category_id) {
        const { data: category } = await supabase
          .from("categories")
          .select("name")
          .eq("id", artisan.category_id)
          .single();
        if (category) metier = category.name;
      }

      seoDescription = await generateSeoDescription(
        artisan.business_name,
        metier,
        artisan.city,
        html
      );
      console.log(`[sync-artisan-media] Generated SEO description: ${seoDescription?.substring(0, 50)}...`);
    }

    // Update artisan record
    const updates: Record<string, unknown> = {};
    
    if (validImages.length > 0) {
      updates.portfolio_images = [...existingPhotos, ...validImages.slice(0, slotsAvailable)];
    }
    
    if (newVideos.length > 0) {
      updates.portfolio_videos = [...existingVideos, ...newVideos];
    }
    
    if (seoDescription) {
      updates.description = seoDescription;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("artisans")
        .update(updates)
        .eq("id", artisanId);

      if (updateError) {
        console.error("[sync-artisan-media] Update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update artisan" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const result = {
      success: true,
      photos_added: validImages.length,
      videos_added: newVideos.length,
      description_generated: !!seoDescription,
      total_photos: (updates.portfolio_images as string[] || existingPhotos).length,
      total_videos: (updates.portfolio_videos as string[] || existingVideos).length,
    };

    console.log(`[sync-artisan-media] Result:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync-artisan-media] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
