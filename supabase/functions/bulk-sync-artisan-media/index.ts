import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_IMAGE_SIZE = 10000;
const MAX_PHOTOS = 12;
const MAX_VIDEOS = 6;
const BATCH_SIZE = 5;
const MAX_ARTISANS_PER_RUN = 50; // Process 50 per invocation to stay within timeout

function extractImageUrls(html: string, baseUrl: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)[^>]*>/gi;
  const bgRegex = /background(?:-image)?\s*:\s*url\(['"]?([^"')]+)['"]?\)/gi;
  const srcsetRegex = /srcset=["']([^"']+)[^']/gi;
  const urls = new Set<string>();

  let match;
  while ((match = imgRegex.exec(html)) !== null) urls.add(match[1]);
  while ((match = bgRegex.exec(html)) !== null) urls.add(match[1]);
  while ((match = srcsetRegex.exec(html)) !== null) {
    match[1].split(",").map(s => s.trim().split(/\s+/)[0]).forEach(url => urls.add(url));
  }

  const resolved: string[] = [];
  for (const url of urls) {
    try {
      const fullUrl = new URL(url, baseUrl).href;
      if (fullUrl.startsWith("data:")) continue;
      if (/\.(svg|ico|gif)(\?|$)/i.test(fullUrl)) continue;
      if (/favicon|logo|icon|pixel|tracking|analytics|badge|button|banner-ad/i.test(fullUrl)) continue;
      if (/1x1|spacer|blank|transparent/i.test(fullUrl)) continue;
      if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(fullUrl) && !fullUrl.includes("/wp-content/uploads/")) continue;
      resolved.push(fullUrl);
    } catch { /* skip */ }
  }
  return resolved;
}

function extractYouTubeUrls(html: string): string[] {
  const urls = new Set<string>();
  const iframeRegex = /src=["'](https?:\/\/(?:www\.)?youtube\.com\/embed\/[^"'?]+)[^"']*/gi;
  const hrefRegex = /href=["'](https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^"'&]+)[^"']*/gi;
  let match;
  while ((match = iframeRegex.exec(html)) !== null) urls.add(match[1]);
  while ((match = hrefRegex.exec(html)) !== null) urls.add(match[1]);

  const standardized: string[] = [];
  for (const url of urls) {
    const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
    if (embedMatch) standardized.push(`https://www.youtube.com/watch?v=${embedMatch[1]}`);
    else standardized.push(url);
  }
  return standardized;
}

async function isImageLargeEnough(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) < MIN_IMAGE_SIZE) return false;
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.startsWith("image/")) return false;
    return true;
  } catch { return false; }
}

async function generateSeoDescription(businessName: string, metier: string, city: string, websiteContent: string): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;
  try {
    const textContent = websiteContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 2000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `Tu es un expert en rédaction SEO pour artisans du bâtiment en France. Rédige une description professionnelle et convaincante.\nRègles strictes :\n- Maximum 300 caractères\n- Français courant et professionnel\n- Mots-clés SEO : "artisan certifié", "devis gratuit", "travaux de qualité"\n- Mentionne la ville pour le référencement local\n- Ton persuasif mais naturel\n- Ne commence PAS par le nom de l'entreprise\n- Pas de guillemets autour du texte\n- Une ou deux phrases maximum` },
          { role: "user", content: `Rédige une description SEO pour cet artisan :\n- Entreprise : ${businessName}\n- Métier : ${metier}\n- Ville : ${city}\n\nContenu de leur site web (pour contexte) :\n${textContent}\n\nLa description doit refléter leurs spécialités réelles vues sur le site.` }
        ],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch { return null; }
}

async function syncOneArtisan(supabase: ReturnType<typeof createClient>, artisan: Record<string, unknown>): Promise<{ id: string; photos: number; videos: number; description: boolean; error?: string }> {
  const id = artisan.id as string;
  let websiteUrl = (artisan.website_url as string).trim();
  if (!websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) websiteUrl = `https://${websiteUrl}`;

  let html = "";
  try {
    const response = await fetch(websiteUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ArtisansValidesBot/1.0)", "Accept": "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { id, photos: 0, videos: 0, description: false, error: `HTTP ${response.status}` };
    html = await response.text();
  } catch (e) {
    return { id, photos: 0, videos: 0, description: false, error: "fetch_failed" };
  }

  // Extract & validate images
  const existingPhotos = (artisan.portfolio_images as string[]) || [];
  const slotsAvailable = MAX_PHOTOS - existingPhotos.length;
  const imageUrls = extractImageUrls(html, websiteUrl);
  const validImages: string[] = [];
  if (slotsAvailable > 0) {
    for (let i = 0; i < imageUrls.length && validImages.length < slotsAvailable; i += 5) {
      const batch = imageUrls.slice(i, i + 5);
      const results = await Promise.all(batch.map(async url => {
        if (existingPhotos.includes(url)) return null;
        return (await isImageLargeEnough(url)) ? url : null;
      }));
      validImages.push(...results.filter((u): u is string => u !== null));
    }
  }

  // Extract YouTube
  const existingVideos = (artisan.portfolio_videos as string[]) || [];
  const newVideos = extractYouTubeUrls(html).filter(u => !existingVideos.includes(u)).slice(0, MAX_VIDEOS - existingVideos.length);

  // SEO description
  let seoDescription: string | null = null;
  const desc = artisan.description as string | null;
  if (!desc || desc.length < 50) {
    let metier = "artisan du bâtiment";
    if (artisan.category_id) {
      const { data: cat } = await supabase.from("categories").select("name").eq("id", artisan.category_id).single();
      if (cat) metier = cat.name;
    }
    seoDescription = await generateSeoDescription(artisan.business_name as string, metier, artisan.city as string, html);
  }

  // Update
  const updates: Record<string, unknown> = {};
  if (validImages.length > 0) updates.portfolio_images = [...existingPhotos, ...validImages];
  if (newVideos.length > 0) updates.portfolio_videos = [...existingVideos, ...newVideos];
  if (seoDescription) updates.description = seoDescription;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("artisans").update(updates).eq("id", id);
    if (error) return { id, photos: 0, videos: 0, description: false, error: error.message };
  }

  return { id, photos: validImages.length, videos: newVideos.length, description: !!seoDescription };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Optional: pass offset to continue from where we left off
    let offset = 0;
    let limit = MAX_ARTISANS_PER_RUN;
    try {
      const body = await req.json();
      if (body.offset) offset = body.offset;
      if (body.limit) limit = Math.min(body.limit, 100);
    } catch { /* no body, use defaults */ }

    // Get artisans that need sync: have website but no/empty portfolio
    const { data: artisans, error: fetchError } = await supabase
      .from("artisans")
      .select("id, business_name, city, website_url, portfolio_images, portfolio_videos, description, category_id")
      .not("website_url", "is", null)
      .neq("website_url", "")
      .or("portfolio_images.is.null,portfolio_images.eq.{}")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error("[bulk-sync] Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!artisans || artisans.length === 0) {
      return new Response(JSON.stringify({ done: true, message: "No more artisans to sync", processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[bulk-sync] Processing ${artisans.length} artisans (offset=${offset})`);

    const results: Array<{ id: string; photos: number; videos: number; description: boolean; error?: string }> = [];

    // Process in batches of BATCH_SIZE in parallel
    for (let i = 0; i < artisans.length; i += BATCH_SIZE) {
      const batch = artisans.slice(i, i + BATCH_SIZE);
      console.log(`[bulk-sync] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.map(a => a.business_name).join(", ")}`);
      const batchResults = await Promise.all(batch.map(a => syncOneArtisan(supabase, a)));
      results.push(...batchResults);
    }

    const totalPhotos = results.reduce((s, r) => s + r.photos, 0);
    const totalVideos = results.reduce((s, r) => s + r.videos, 0);
    const totalDescriptions = results.filter(r => r.description).length;
    const errors = results.filter(r => r.error);
    const hasMore = artisans.length === limit;

    const summary = {
      done: !hasMore,
      processed: results.length,
      next_offset: hasMore ? offset + limit : null,
      photos_added: totalPhotos,
      videos_added: totalVideos,
      descriptions_generated: totalDescriptions,
      errors: errors.length,
      error_details: errors.slice(0, 10),
    };

    console.log(`[bulk-sync] Summary:`, summary);

    return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[bulk-sync] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
