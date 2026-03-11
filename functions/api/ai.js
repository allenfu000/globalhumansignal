export async function onRequestPost(context) {
    const { request, env } = context;
  
    const body = await request.json();
    const message = body.message || "hello";
  
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: message
          }
        ]
      })
    });
  
    const data = await response.json();
  
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  }