/**
 * Cloudflare Pages Function: AI Chat Stream
 * Handles global AI Guide chat using OpenRouter streaming.
 */

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  // 1. Check for API Key
  const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY is not configured in Cloudflare." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // 2. Parse Request
    const body = await request.json();
    const { messages, context: pageContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Prepare System Prompt
    const systemPrompt = {
      role: "system",
      content: "You are MEDEXAM AI Guide, a medical learning assistant for students. Help explain medical topics, exams, MCQs, and study plans clearly and safely. Be concise, accurate, and educational. If the question needs clinical judgment, remind the user this is for learning and not medical diagnosis. Use Markdown for formatting."
    };

    // Include page context if provided
    if (pageContext) {
      systemPrompt.content += `\n\nCurrent page context: Title: ${pageContext.pageTitle || 'N/A'}, URL: ${pageContext.pageUrl || 'N/A'}`;
    }

    const fullMessages = [systemPrompt, ...messages];

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://exam-cyx.pages.dev",
        "X-Title": "MEDEXAM AI Medical Learning Assistant"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: fullMessages,
        stream: true
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("OpenRouter Error:", errorText);
      return new Response(
        JSON.stringify({ error: `AI provider error: ${openRouterResponse.status}`, details: errorText }),
        { status: openRouterResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Proxy the stream but parse SSE to raw text for simpler frontend handling
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = openRouterResponse.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    (async () => {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanedLine = line.trim();
            if (!cleanedLine || cleanedLine === "data: [DONE]") continue;
            
            if (cleanedLine.startsWith("data: ")) {
              try {
                const data = JSON.parse(cleanedLine.substring(6));
                const content = data.choices?.[0]?.delta?.content || "";
                if (content) {
                  await writer.write(encoder.encode(content));
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      } catch (err) {
        console.error("Streaming error:", err);
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (err: any) {
    console.error("Internal Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error.", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
