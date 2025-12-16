import { GoogleGenAI, Type, Schema, Part } from "@google/genai";
import { AptusResponse } from "../types";

const MAX_IMAGE_DIMENSION = 1536;
const JPEG_QUALITY = 0.8;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tldr: {
      type: Type.STRING,
      description: "A 1-2 sentence summary of the input's meaning and required action in plain language.",
    },
    ruleLens: {
      type: Type.ARRAY,
      description: "Define the 2-3 most complex terms from the input.",
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          definition: { type: Type.STRING, description: "How this term functions within the document's context." },
        },
        required: ["term", "definition"],
      },
    },
    actionableSteps: {
      type: Type.ARRAY,
      description: "A clear list of the exact next steps (deadlines, required documents).",
      items: { type: Type.STRING },
    },
    sourceCitation: {
      type: Type.STRING,
      description: "Cite the specific section/page used from the input.",
    },
  },
  required: ["tldr", "ruleLens", "actionableSteps", "sourceCitation"],
};

export interface ProcessedPart {
  type: 'inline_data' | 'text_content';
  mimeType?: string; // For inline_data
  data?: string;     // For inline_data (base64)
  text?: string;     // For text_content
}

/**
 * Utility: Wait for a specified duration
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Resizes and compresses images to reduce payload size and latency.
 */
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio while scaling down
      if (width > height) {
        if (width > MAX_IMAGE_DIMENSION) {
          height *= MAX_IMAGE_DIMENSION / width;
          width = MAX_IMAGE_DIMENSION;
        }
      } else {
        if (height > MAX_IMAGE_DIMENSION) {
          width *= MAX_IMAGE_DIMENSION / height;
          height = MAX_IMAGE_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error("Browser does not support canvas image processing."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Export as optimized JPEG
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for optimization."));
    };
  });
};

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Helper to safely extract Base64 data and MimeType from Data URL
 * avoiding Regex on large strings which can cause stack overflow.
 */
const parseDataUrl = (dataUrl: string) => {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) throw new Error("Invalid Data URL format");
  
  // Extract MimeType: data:image/png;base64,... -> image/png
  const mimeType = dataUrl.substring(5, commaIndex).split(';')[0];
  const data = dataUrl.substring(commaIndex + 1);
  
  return { mimeType, data };
};

/**
 * Processes files: 
 * - Images: Compressed -> Base64
 * - PDFs: Base64
 * - Text: Raw String (Token Efficient)
 */
export const processFilesForGemini = async (files: File[]): Promise<ProcessedPart[]> => {
  return Promise.all(files.map(async (file) => {
    try {
      // 1. Handle Plain Text efficiently
      if (file.type === 'text/plain') {
        const textContent = await readFileAsText(file);
        return {
          type: 'text_content',
          text: `[Attached File: ${file.name}]\n${textContent}\n---`
        };
      }

      // 2. Handle Images with Compression
      if (file.type.startsWith('image/')) {
        const dataUrl = await compressImage(file);
        const { mimeType, data } = parseDataUrl(dataUrl);
        return { type: 'inline_data', mimeType, data };
      }

      // 3. Handle PDFs and others as Base64 blobs
      const dataUrl = await readFileAsBase64(file);
      const { mimeType, data } = parseDataUrl(dataUrl);
      
      return { type: 'inline_data', mimeType, data };

    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw new Error(`Could not process ${file.name}. Please try a different file.`);
    }
  }));
};

/**
 * Execute API call with Exponential Backoff
 */
async function callWithRetry<T>(
  fn: () => Promise<T>, 
  retries: number = MAX_RETRIES, 
  backoff: number = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Don't retry on 4xx Client Errors (except 429 Too Many Requests)
    const isClientError = error.message?.includes('400') || error.status === 400;
    const isQuotaError = error.message?.includes('429') || error.status === 429;
    
    if ((isClientError && !isQuotaError) || retries <= 0) {
      throw error;
    }

    console.warn(`API call failed. Retrying in ${backoff}ms... (${retries} retries left)`);
    await delay(backoff);
    return callWithRetry(fn, retries - 1, backoff * 2);
  }
}

export const analyzeDocument = async (
  text: string,
  files: ProcessedPart[],
  targetLanguage: string
): Promise<AptusResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("System Error: API Key is missing. Please check configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Robust system instruction
  const systemInstruction = `
Role: You are Aptus, a highly specialized, empathetic, and multilingual legal interpreter.
Core Task: Convert complex legal/bureaucratic input (text or image) into simplified, actionable, and verified information.

Operational Rules:
1. STRICTLY and EXCLUSIVELY use the provided input (text or images) as your sole source of truth.
2. DO NOT use general internet knowledge to fill gaps. If information is missing, state it clearly in the output.
3. NEVER offer legal advice. You are an interpreter, not a lawyer.
4. If the input is illegible or not a document (e.g., a random photo), return a polite error message in the 'tldr' field explaining why it cannot be analyzed.

Output Requirement:
- Provide the output in the target language: ${targetLanguage}.
- Structure the response exactly according to the requested JSON schema.
- For "Source Citation", strictly cite where in the provided text/image the information comes from (e.g., "Page 1, Paragraph 2").
`;

  const parts: Part[] = [];
  
  // Construct parts based on processed type
  files.forEach((file) => {
    if (file.type === 'inline_data' && file.data && file.mimeType) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data,
        },
      });
    } else if (file.type === 'text_content' && file.text) {
      parts.push({ text: file.text });
    }
  });

  // Add user typed text
  if (text.trim()) {
    parts.push({
      text: `User Text Input:\n${text}`
    });
  }

  if (parts.length === 0) {
    throw new Error("No input provided. Please upload a file or enter text.");
  }

  try {
    const response = await callWithRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          role: "user",
          parts: parts,
        },
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1, // Low temperature for strict grounding
        },
      });
    });

    // Check for safety blocking or other finish reasons
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("Analysis blocked. The document contains content flagged as unsafe or sensitive.");
      }
      if (candidate.finishReason === 'RECITATION') {
        throw new Error("Analysis blocked due to copyright content restrictions.");
      }
      throw new Error(`Analysis stopped unexpectedly (Reason: ${candidate.finishReason}). Please try a clearer document.`);
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error("The AI returned an empty response. Please try again.");
    }

    return JSON.parse(responseText) as AptusResponse;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    if (error.message?.includes('400')) {
       throw new Error("The document is too large or contains prohibited content.");
    }
    if (error.message?.includes('429')) {
       throw new Error("Service is currently busy. Please try again in a moment.");
    }
    if (error.message?.includes('500') || error.message?.includes('503')) {
       throw new Error("Gemini service is temporarily unavailable. Please try again.");
    }
    
    throw error;
  }
};