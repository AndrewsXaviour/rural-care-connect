import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_INSTRUCTION = `You are Asha, the RuralCare AI Health Assistant.
Your primary goal is to provide helpful, empathetic, and culturally sensitive health guidance to rural Indian users.
Key Guidelines:
1. Use simple, clear language. Avoid overly complex medical jargon.
2. If a user asks about local hospitals, encourage them to use the "Nearby Hospitals" tab in the app.
3. If a user asks about their reports, explain that they can find detailed interpretations in the "Reports" tab.
4. IN CASE OF EMERGENCY: Always prioritize telling the user to use the "SOS Emergency" button or call local emergency numbers immediately.
5. Provide general health advice (nutrition, hygiene, maternal health, child care) but always add a disclaimer: "I am an AI assistant, not a doctor. Please consult a healthcare professional for a diagnosis."
6. Be encouraging and respectful. You are a "bridge" between technology and traditional village wisdom.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured on server" });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Limit message payload size to prevent abuse
    if (messages.length > 50) {
      return res.status(400).json({ error: "Too many messages (max 50)" });
    }

    // Limit message payload size to prevent abuse
    if (messages.length > 50) {
      return res.status(400).json({ error: "Too many messages (max 50)" });
    }

    // Filter to start from the first user message (Gemini requirement)
    const firstUserIdx = messages.findIndex((m: { role: string }) => m.role === "user");
    if (firstUserIdx === -1) {
      return res.status(400).json({ error: "At least one user message is required" });
    }

    const apiMessages = messages.slice(firstUserIdx);

    // Build Gemini API request
    const contents = apiMessages.map((msg: { role: string; text: string }) => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    const requestBody = {
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`Gemini API error (${response.status}):`, errorText);
      return res.status(response.status).json({
        error: `Gemini API returned ${response.status}`,
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: "No response from Gemini API" });
    }

    return res.status(200).json({ text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Gemini proxy error:", message);
    return res.status(500).json({ error: "Failed to process request" });
  }
}
