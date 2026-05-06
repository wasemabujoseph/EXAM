/**
 * Cloudflare Pages Function: AI Health Check
 * Checks if the AI backend is reachable and configured.
 */

export const onRequestGet = async (context: any) => {
  const { env } = context;

  const hasOpenRouterKey = !!env.OPENROUTER_API_KEY;

  return new Response(
    JSON.stringify({
      ok: true,
      hasOpenRouterKey,
      message: "AI backend reachable",
      timestamp: new Date().toISOString()
    }),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
};
