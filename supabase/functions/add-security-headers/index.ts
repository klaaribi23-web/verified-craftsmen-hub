import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Security headers to add to all responses
const securityHeaders = {
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  
  // XSS protection for older browsers
  "X-XSS-Protection": "1; mode=block",
  
  // Force HTTPS
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  
  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // Permissions policy (restrict browser features)
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=()",
  
  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.ipify.org",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
};

serve(async (req) => {
  // This function returns the recommended security headers
  // It can be called by the frontend to verify security configuration
  
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Return the security headers configuration
  return new Response(
    JSON.stringify({
      headers: securityHeaders,
      description: "These security headers should be applied to all responses",
      recommendations: [
        "Add these headers to your Netlify/Vercel configuration",
        "Or use a Cloudflare Worker to inject them",
        "Consider enabling additional protections like rate limiting",
      ],
    }),
    {
      headers: {
        ...corsHeaders,
        ...securityHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});
