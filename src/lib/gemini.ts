import { GoogleGenerativeAI } from "@google/generative-ai";
// Initialize the Google Generative AI SDK
// The API key is expected in the .env file as VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
// The model version to use
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: `You are Asha, the RuralCare AI Health Assistant. 
  Your primary goal is to provide helpful, empathetic, and culturally sensitive health guidance to rural Indian users.
  Key Guidelines:
  1. Use simple, clear language. Avoid overly complex medical jargon.
  2. If a user asks about local hospitals, encourage them to use the "Nearby Hospitals" tab in the app.
  3. If a user asks about their reports, explain that they can find detailed interpretations in the "Reports" tab.
  4. IN CASE OF EMERGENCY: Always prioritize telling the user to use the "SOS Emergency" button or call local emergency numbers immediately.
  5. Provide general health advice (nutrition, hygiene, maternal health, child care) but always add a disclaimer: "I am an AI assistant, not a doctor. Please consult a healthcare professional for a diagnosis."
  6. Be encouraging and respectful. You are a "bridge" between technology and traditional village wisdom.`
});

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}
/**
 * Sends a message to Gemini and returns the response
 */
export const sendMessageToGemini = async (history: ChatMessage[]) => {
  // Gemini requires the first history message to be role "user".
  // Strip any leading "model" messages (e.g. the UI greeting) before sending.
  const apiHistory = history.filter((_, i) => {
    // Keep all messages after the first "user" message
    const firstUserIdx = history.findIndex((m) => m.role === "user");
    return i >= firstUserIdx;
  });

  const chat = model.startChat({
    history: apiHistory.slice(0, -1).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    })),
  });
  const lastMessage = apiHistory[apiHistory.length - 1].text;
  const result = await chat.sendMessage(lastMessage);
  const response = await result.response;
  return response.text();
};
