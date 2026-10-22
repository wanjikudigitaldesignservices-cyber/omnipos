/**
 * OmniPOS Gemini 2.5 Flash AI Client
 * Supports Tool-Calling, Multimodal Vision OCR, and graceful local simulation fallback.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export interface ChatMessage {
  role: "user" | "model" | "system" | "function";
  parts: Array<{
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string; // base64
    };
    functionCall?: {
      name: string;
      args: Record<string, any>;
    };
    functionResponse?: {
      name: string;
      response: Record<string, any>;
    };
  }>;
}

export interface ToolDeclaration {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: {
      type: "OBJECT";
      properties: Record<
        string,
        {
          type: "STRING" | "NUMBER" | "BOOLEAN" | "ARRAY" | "OBJECT";
          description?: string;
          enum?: string[];
        }
      >;
      required?: string[];
    };
  }>;
}

/**
 * Executes a call to Google Gemini 2.5 Flash with tool calling or multimodal vision.
 */
export async function callGemini(params: {
  contents: ChatMessage[];
  systemInstruction?: string;
  tools?: ToolDeclaration[];
  temperature?: number;
  responseMimeType?: string;
}): Promise<{
  text?: string;
  functionCalls?: Array<{ name: string; args: Record<string, any> }>;
  error?: string;
}> {
  if (!GEMINI_API_KEY) {
    return {
      error: "NO_API_KEY",
    };
  }

  try {
    const url = `${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`;

    const body: Record<string, any> = {
      contents: params.contents,
      generationConfig: {
        temperature: params.temperature ?? 0.2,
      },
    };

    if (params.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: params.systemInstruction }],
      };
    }

    if (params.tools && params.tools.length > 0) {
      body.tools = params.tools;
    }

    if (params.responseMimeType) {
      body.generationConfig.responseMimeType = params.responseMimeType;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API HTTP Error:", res.status, errText);
      return { error: `Gemini API error: ${res.statusText}` };
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) {
      return { error: "No candidate returned by Gemini." };
    }

    const parts = candidate.content?.parts || [];
    let textResponse = "";
    const functionCalls: Array<{ name: string; args: Record<string, any> }> = [];

    for (const part of parts) {
      if (part.text) {
        textResponse += part.text;
      }
      if (part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        });
      }
    }

    return {
      text: textResponse,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    };
  } catch (err: any) {
    console.error("callGemini Exception:", err);
    return { error: err.message || "Unknown error connecting to Gemini API." };
  }
}

/**
 * Helper to execute multimodal vision prompting on an image base64 payload.
 */
export async function generateGeminiVisionText(params: {
  prompt: string;
  imageMimeType: string;
  imageBase64: string;
}): Promise<string> {
  const res = await callGemini({
    contents: [
      {
        role: "user",
        parts: [
          { text: params.prompt },
          {
            inlineData: {
              mimeType: params.imageMimeType,
              data: params.imageBase64,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
  });

  if (res.error) {
    throw new Error(res.error);
  }

  return res.text || "";
}

