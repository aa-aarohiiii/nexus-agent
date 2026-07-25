// Vercel serverless function — keeps your Anthropic API key on the server.
// The browser calls /api/plan, never api.anthropic.com directly.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not set in the deployment's environment variables." });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing 'prompt' string in request body." });
    return;
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data.error?.message || "Anthropic API request failed", detail: data });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Unexpected server error" });
  }
}
