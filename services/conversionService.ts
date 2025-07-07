import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY, CLAUDE_MODEL_NAME } from '../constants';

// Use the Claude API key
let currentApiKey: string | null = CLAUDE_API_KEY;
let anthropic: Anthropic | null = null;

const initializeClaudeClient = () => {
  if (currentApiKey && currentApiKey.trim() !== "") {
    try {
      console.log("Creating Anthropic client...");
      anthropic = new Anthropic({ 
        apiKey: currentApiKey,
        maxRetries: 3,
        timeout: 60000,
        dangerouslyAllowBrowser: true // Allow browser usage
      });
      console.log(`Conversion service initialized with Claude key ending: ...${currentApiKey.slice(-4)}`);
    } catch (error) {
      console.error("Failed to initialize Claude client for conversion:", error);
      anthropic = null;
    }
  } else {
    anthropic = null;
    console.warn("API Key is not set. Conversion services will not function.");
  }
};

// Initialize the Claude client
initializeClaudeClient();

export interface ConversionResponse {
  flutterCode: string;
  reactCode: string;
}

const constructFlutterConversionPrompt = (swiftCode: string): string => {
  return `You are an expert mobile app developer specializing in converting iOS SwiftUI code to Flutter/Dart code.

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

**RESPONSE FORMAT**: You must respond with ONLY a valid JSON object in this exact format:
{
  "flutterCode": "COMPLETE_FLUTTER_CODE_HERE"
}

Ensure the flutterCode is a valid, properly escaped string within the JSON structure.
If the SwiftUI code is complex, break it down into appropriate Flutter widgets and maintain the same user experience.

Do not include any other text, explanations, or formatting outside of the JSON object.`;
};

const constructReactConversionPrompt = (swiftCode: string): string => {
  return `You are an expert mobile app developer specializing in converting iOS SwiftUI code to React Native code.

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

**RESPONSE FORMAT**: You must respond with ONLY a valid JSON object in this exact format:
{
  "reactCode": "COMPLETE_REACT_NATIVE_CODE_HERE"
}

Ensure the reactCode is a valid, properly escaped string within the JSON structure.
If the SwiftUI code is complex, break it down into appropriate React Native components and maintain the same user experience.

Do not include any other text, explanations, or formatting outside of the JSON object.`;
};

const callClaudeApi = async (prompt: string): Promise<string> => {
  if (!anthropic) {
    throw new Error("Claude client not initialized. Please check your API key.");
  }

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL_NAME,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    if (!response.content || response.content.length === 0) {
      throw new Error("Empty response from Claude API");
    }

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    if (!responseText) {
      throw new Error("No text content in Claude API response");
    }

    return responseText;
  } catch (error) {
    console.error("Error calling Claude API for conversion:", error);
    throw new Error(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const parseConversionResponse = (responseText: string, type: 'flutter' | 'react' | 'swift'): string => {
  let jsonStr = responseText.trim();
    
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  try {
    const parsedData = JSON.parse(jsonStr);
    const codeKey = type === 'flutter' ? 'flutterCode' : type === 'react' ? 'reactCode' : 'swiftCode';
    
    if (!parsedData[codeKey]) {
      console.error(`Parsed data missing ${codeKey}`, parsedData);
      throw new Error(`Invalid response structure from Claude. Missing ${codeKey}.`);
    }
    
    if (parsedData[codeKey].trim() === "") {
      throw new Error(`Claude returned empty ${type} code. Try again.`);
    }
    
    return parsedData[codeKey];
  } catch(e) {
    console.error("Failed to parse conversion response:", jsonStr, e);
    throw new Error(`Failed to parse Claude's conversion response. Raw: ${jsonStr.substring(0,200)}...`);
  }
};

export const convertSwiftToFlutter = async (swiftCode: string): Promise<{ flutterCode: string }> => {
  if (!swiftCode || swiftCode.trim() === '') {
    throw new Error('No Swift code provided for conversion');
  }

  const prompt = constructFlutterConversionPrompt(swiftCode);
  const response = await callClaudeApi(prompt);
  const flutterCode = parseConversionResponse(response, 'flutter');
  
  return { flutterCode };
};

export const convertSwiftToReact = async (swiftCode: string): Promise<{ reactCode: string }> => {
  if (!swiftCode || swiftCode.trim() === '') {
    throw new Error('No Swift code provided for conversion');
  }

  const prompt = constructReactConversionPrompt(swiftCode);
  const response = await callClaudeApi(prompt);
  const reactCode = parseConversionResponse(response, 'react');
  
  return { reactCode };
};

const constructFlutterToSwiftConversionPrompt = (flutterCode: string): string => {
  return `You are an expert mobile app developer specializing in converting Flutter/Dart code to iOS SwiftUI code.

The following Flutter code needs to be converted to SwiftUI:

\`\`\`dart
${flutterCode}
\`\`\`

Please convert this Flutter code to equivalent SwiftUI code. The SwiftUI code should:

1. Maintain the same functionality and UI layout as the original Flutter code
2. Use SwiftUI components and styling
3. Include proper state management (@State, @Binding, @ObservedObject as needed)
4. Handle user interactions and data flow
5. Be complete and runnable SwiftUI code
6. Include necessary imports
7. Follow SwiftUI best practices and conventions

**RESPONSE FORMAT**: You must respond with ONLY a valid JSON object in this exact format:
{
  "swiftCode": "COMPLETE_SWIFTUI_CODE_HERE"
}

Ensure the swiftCode is a valid, properly escaped string within the JSON structure.
If the Flutter code is complex, break it down into appropriate SwiftUI views and maintain the same user experience.

Do not include any other text, explanations, or formatting outside of the JSON object.`;
};

const constructReactToSwiftConversionPrompt = (reactCode: string): string => {
  return `You are an expert mobile app developer specializing in converting React Native code to iOS SwiftUI code.

The following React Native code needs to be converted to SwiftUI:

\`\`\`jsx
${reactCode}
\`\`\`

Please convert this React Native code to equivalent SwiftUI code. The SwiftUI code should:

1. Maintain the same functionality and UI layout as the original React Native code
2. Use SwiftUI components and styling
3. Include proper state management (@State, @Binding, @ObservedObject as needed)
4. Handle user interactions and data flow
5. Be complete and runnable SwiftUI code
6. Include necessary imports
7. Follow SwiftUI best practices and conventions

**RESPONSE FORMAT**: You must respond with ONLY a valid JSON object in this exact format:
{
  "swiftCode": "COMPLETE_SWIFTUI_CODE_HERE"
}

Ensure the swiftCode is a valid, properly escaped string within the JSON structure.
If the React Native code is complex, break it down into appropriate SwiftUI views and maintain the same user experience.

Do not include any other text, explanations, or formatting outside of the JSON object.`;
};

export const convertFlutterToSwift = async (flutterCode: string): Promise<{ swiftCode: string }> => {
  if (!flutterCode || flutterCode.trim() === '') {
    throw new Error('No Flutter code provided for conversion');
  }

  const prompt = constructFlutterToSwiftConversionPrompt(flutterCode);
  const response = await callClaudeApi(prompt);
  const swiftCode = parseConversionResponse(response, 'swift');
  
  return { swiftCode };
};

export const convertReactToSwift = async (reactCode: string): Promise<{ swiftCode: string }> => {
  if (!reactCode || reactCode.trim() === '') {
    throw new Error('No React Native code provided for conversion');
  }

  const prompt = constructReactToSwiftConversionPrompt(reactCode);
  const response = await callClaudeApi(prompt);
  const swiftCode = parseConversionResponse(response, 'swift');
  
  return { swiftCode };
}; 