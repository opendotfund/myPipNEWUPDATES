import { GoogleGenAI, Content } from "@google/genai";
import { GEMINI_MODEL_NAME, HARDCODED_API_KEY } from '../constants';

// Use the hardcoded API key as the default
let currentApiKey: string | null = HARDCODED_API_KEY;
let ai: GoogleGenAI | null = null;

const initializeAiClient = () => {
  if (currentApiKey && currentApiKey.trim() !== "") {
    try {
      ai = new GoogleGenAI({ apiKey: currentApiKey });
      console.log(`Conversion service initialized with key ending: ...${currentApiKey.slice(-4)}`);
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI client for conversion:", error);
      ai = null;
    }
  } else {
    ai = null;
    console.warn("API Key is not set. Conversion services will not function.");
  }
};

// Initialize the AI client
initializeAiClient();

export interface ConversionResponse {
  flutterCode: string;
  reactCode: string;
}

const constructFlutterConversionPrompt = (swiftCode: string): Content[] => {
  const systemInstruction = `
You are an expert mobile app developer specializing in converting iOS SwiftUI code to Flutter/Dart code.

The following SwiftUI code needs to be converted to Flutter:

\`\`\`swift
${swiftCode}
\`\`\`

Please convert this SwiftUI code to equivalent Flutter/Dart code. The Flutter code should:

1. Maintain the same functionality and UI layout as the original SwiftUI code
2. Use Flutter's Material Design or Cupertino widgets as appropriate
3. Include proper state management (StatefulWidget if needed)
4. Handle user interactions and data flow
5. Be complete and runnable Flutter code
6. Include necessary imports
7. Follow Flutter best practices and conventions

Return your response as a single JSON object with the following structure:
{
  "flutterCode": "COMPLETE_FLUTTER_CODE_HERE"
}

Ensure the flutterCode is a valid, properly escaped string within the JSON structure.
If the SwiftUI code is complex, break it down into appropriate Flutter widgets and maintain the same user experience.
`;
  return [{ role: "user", parts: [{ text: systemInstruction }] }];
};

const constructReactConversionPrompt = (swiftCode: string): Content[] => {
  const systemInstruction = `
You are an expert mobile app developer specializing in converting iOS SwiftUI code to React Native code.

The following SwiftUI code needs to be converted to React Native:

\`\`\`swift
${swiftCode}
\`\`\`

Please convert this SwiftUI code to equivalent React Native code. The React Native code should:

1. Maintain the same functionality and UI layout as the original SwiftUI code
2. Use React Native components and styling
3. Include proper state management (useState, useEffect as needed)
4. Handle user interactions and data flow
5. Be complete and runnable React Native code
6. Include necessary imports
7. Follow React Native best practices and conventions
8. Use appropriate React Native components (View, Text, TouchableOpacity, etc.)

Return your response as a single JSON object with the following structure:
{
  "reactCode": "COMPLETE_REACT_NATIVE_CODE_HERE"
}

Ensure the reactCode is a valid, properly escaped string within the JSON structure.
If the SwiftUI code is complex, break it down into appropriate React Native components and maintain the same user experience.
`;
  return [{ role: "user", parts: [{ text: systemInstruction }] }];
};

const callGeminiApi = async (structuredContents: Content[]): Promise<any> => {
  if (!ai) {
    throw new Error("AI client not initialized. Please check your API key.");
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: structuredContents,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    const text = response.text;
    
    if (!text) {
      throw new Error("No response received from AI");
    }

    return text;
  } catch (error) {
    console.error("Error calling Gemini API for conversion:", error);
    throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const parseConversionResponse = (responseText: string, type: 'flutter' | 'react'): string => {
  let jsonStr = responseText.trim();
    
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  try {
    const parsedData = JSON.parse(jsonStr);
    const codeKey = type === 'flutter' ? 'flutterCode' : 'reactCode';
    
    if (!parsedData[codeKey]) {
      console.error(`Parsed data missing ${codeKey}`, parsedData);
      throw new Error(`Invalid response structure from AI. Missing ${codeKey}.`);
    }
    
    if (parsedData[codeKey].trim() === "") {
      throw new Error(`AI returned empty ${type} code. Try again.`);
    }
    
    return parsedData[codeKey];
  } catch(e) {
    console.error("Failed to parse conversion response:", jsonStr, e);
    throw new Error(`Failed to parse AI's conversion response. Raw: ${jsonStr.substring(0,200)}...`);
  }
};

export const convertSwiftToFlutter = async (swiftCode: string): Promise<{ flutterCode: string }> => {
  if (!swiftCode || swiftCode.trim() === '') {
    throw new Error('No Swift code provided for conversion');
  }

  const prompt = constructFlutterConversionPrompt(swiftCode);
  const response = await callGeminiApi(prompt);
  const flutterCode = parseConversionResponse(response, 'flutter');
  
  return { flutterCode };
};

export const convertSwiftToReact = async (swiftCode: string): Promise<{ reactCode: string }> => {
  if (!swiftCode || swiftCode.trim() === '') {
    throw new Error('No Swift code provided for conversion');
  }

  const prompt = constructReactConversionPrompt(swiftCode);
  const response = await callGeminiApi(prompt);
  const reactCode = parseConversionResponse(response, 'react');
  
  return { reactCode };
}; 