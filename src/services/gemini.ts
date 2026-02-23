import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function processAudioTask(base64Audio: string, mimeType: string) {
  const prompt = `You are a helpful assistant for university students.
Listen to the audio and extract the task details.
The current time is ${new Date().toISOString()}.
Return a JSON object with the following structure:
- heading: A short, clear title for the task
- body: Detailed description of the task, including any specific requirements or notes
- dueDate: The due date and time in ISO 8601 format. If no year is mentioned, assume the current or next logical year. If no time is mentioned, assume 23:59:59 local time.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          body: { type: Type.STRING },
          dueDate: { type: Type.STRING },
        },
        required: ["heading", "body", "dueDate"],
      },
    },
  });

  if (response.text) {
    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse JSON", e);
      return null;
    }
  }
  return null;
}
