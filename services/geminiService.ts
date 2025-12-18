import { GoogleGenAI } from "@google/genai";
import { PromptRequest } from "../types";
import { SYSTEM_PROMPT } from "../constants";

export const optimizePrompt = async (
  request: PromptRequest
): Promise<string> => {
  // ✅ Vite uses import.meta.env (NOT process.env)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API Key not found. Check your .env file.");
  }

  // ✅ Initialize Gemini client correctly
  const ai = new GoogleGenAI({ apiKey });

  // ✅ User input formatted cleanly
  const userMessage = `
User Idea: ${request.idea}
Prompt Type: ${request.type}
Tone: ${request.tone}
Skill Level: ${request.level}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    // ✅ Safe fallback
    return response.text ?? "Failed to generate optimized prompt.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to communicate with Gemini AI.");
  }
};
