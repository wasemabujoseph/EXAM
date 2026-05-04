export const onRequestPost: PagesFunction<{ OPENROUTER_API_KEY: string }> = async (context) => {
  const { OPENROUTER_API_KEY } = context.env;

  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: "Server configuration error: Missing API Key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body: any = await context.request.json();
    const { 
      question, 
      options, 
      correctAnswer, 
      selectedAnswer, 
      examTitle, 
      chatHistory = [], 
      userMessage, 
      mode = "initial" 
    } = body;

    const systemPrompt = `You are MEDEXAM AI Insight, a concise medical education assistant. Explain medical MCQs clearly for students. Be accurate, practical, and exam-focused. Explain why the correct answer is correct and why the incorrect options are wrong. Keep the tone professional and supportive. Do not invent facts. If information is missing, say so.`;

    let messages = [];
    if (mode === "initial") {
      const initialPrompt = `Exam Title: ${examTitle || 'Medical Exam'}
Question: ${question}
Options: ${JSON.stringify(options)}
Student Selected: ${selectedAnswer || 'None'}
Correct Answer: ${correctAnswer}

Task:
Explain this MCQ clearly and concisely for a medical student. Include why the correct answer is correct and why each incorrect option is wrong. Provide a Clinical Pearl at the end.`;
      
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: initialPrompt }
      ];
    } else {
      // For follow-up, include context and history
      messages = [
        { role: "system", content: systemPrompt },
        { role: "system", content: `Context Question: ${question}\nOptions: ${JSON.stringify(options)}\nCorrect: ${correctAnswer}\nStudent Selected: ${selectedAnswer}` },
        ...chatHistory,
        { role: "user", content: userMessage }
      ];
    }

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://exam-cyx.pages.dev",
        "X-Title": "MEDEXAM AI Medical Learning Assistant",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: messages,
        stream: true,
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      return new Response(JSON.stringify({ error: `OpenRouter error: ${openRouterResponse.status}`, details: errorText }), {
        status: openRouterResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Proxy the stream
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
        "Connection": "keep-alive",
      },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
