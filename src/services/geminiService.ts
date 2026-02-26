import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateGeminiResponse = async (message: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: "You are a witty, helpful friend on Telegram. Keep responses short (max 2-3 sentences), use modern slang/emojis, and be informal.",
      }
    });
    return response.text || 'Oops, I lost my train of thought 😅';
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return 'Sorry, I am having trouble connecting to my brain right now 🤖';
  }
};
