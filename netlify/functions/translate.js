// Accepts POST { prompt: string }
// Returns the raw LLM text (client parses JSON defensively)
// Set ANTHROPIC_API_KEY in Netlify environment variables

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  }

  let prompt;
  try {
    ({ prompt } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, headers: cors, body: "Invalid JSON" };
  }
  if (!prompt) {
    return { statusCode: 400, headers: cors, body: "Missing prompt" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: cors, body: "Server configuration error" };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    console.error("Anthropic error:", await response.text());
    return { statusCode: 502, headers: cors, body: "Translation service error" };
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  return {
    statusCode: 200,
    headers: { ...cors, "Content-Type": "application/json" },
    body: text
  };
};
