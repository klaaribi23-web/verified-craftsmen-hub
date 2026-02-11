const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- In-memory rate limiter ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

const AGENT_ID = "agent_6601kgxsc1p6fejs677egvgaycez";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limit: 5 token requests per IP per 10 minutes
  const ip = getClientIp(req);
  if (!checkRateLimit(ip, 5, 10 * 60 * 1000)) {
    return new Response(
      JSON.stringify({ error: "Trop de requêtes. Réessayez dans un instant." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("[ElevenLabs Token] ELEVENLABS_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ElevenLabs Token] Requesting conversation token for agent ${AGENT_ID}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${AGENT_ID}`,
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ElevenLabs Token] API error ${response.status}: ${errorText}`);

      console.log("[ElevenLabs Token] Falling back to signed URL...");
      const fallbackResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
        { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
      );

      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text();
        console.error(`[ElevenLabs Token] Fallback also failed: ${fallbackError}`);
        return new Response(
          JSON.stringify({ error: `ElevenLabs API error: ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const fallbackData = await fallbackResponse.json();
      console.log("[ElevenLabs Token] Signed URL fallback obtained");
      return new Response(
        JSON.stringify({ signed_url: fallbackData.signed_url, mode: "websocket" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("[ElevenLabs Token] Conversation token obtained successfully");

    return new Response(
      JSON.stringify({ token: data.token, mode: "webrtc" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ElevenLabs Token] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
