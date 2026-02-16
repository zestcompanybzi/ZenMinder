
import { GoogleGenAI, Type } from "@google/genai";
import { AICommandResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function processNaturalLanguage(prompt: string): Promise<AICommandResponse> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The user is using a "32 Baar Formula" eating app. This method involves chewing each bite 32 times and taking 1 minute per bite. 
    Interpret their request: "${prompt}".
    
    Rules:
    - If they want to start eating, identify the duration in minutes.
    - If they ask about the 32 baar formula, explain that it's about chewing food until it's liquid to aid digestion and weight loss.
    - Be encouraging and focus on mindfulness.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: {
            type: Type.STRING,
            enum: ['START_SESSION', 'INFO_ONLY'],
            description: "Whether to start a session or just provide info."
          },
          minutes: {
            type: Type.NUMBER,
            description: "Total duration in minutes."
          },
          message: {
            type: Type.STRING,
            description: "A friendly response message."
          }
        },
        required: ["action", "message"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as AICommandResponse;
  } catch (e) {
    return {
      action: 'INFO_ONLY',
      minutes: 0,
      message: "I'm here to help you with your 32-Baar journey. Just tell me how long you'd like to eat!"
    };
  }
}
