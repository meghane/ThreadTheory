// src/services/gemini.js
import { GoogleGenAI, Type } from '@google/genai';

// Initialize the client instance once globally
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Generates structured outfit combinations using Gemini 2.5 Flash-Lite.
 * Explicitly tells the AI to create custom, descriptive content.
 */
// src/services/gemini.js

export async function generateAIOutfit(items, filters = {}, maxResults = 12) {
  // 1. Cap the max results to 5 or 6 for the AI tier. 
  // This keeps the JSON footprint small enough that it NEVER hits the cutoff wall!
  const targetCount = Math.min(maxResults, 6);

  const cleanWardrobe = items.map(item => ({
    id: String(item.id), 
    name: item.name,
    category: item.category,
    color: item.color,
    style: item.style || 'Casual',
    season: item.season || 'All seasons'
  }));

  const prompt = `
    You are an expert fashion stylist. Look at this wardrobe data and create a diverse list of exactly ${targetCount} unique outfit combinations.
    
    SHUFFLE SEED: ${Math.random()} 

    CRITICAL FILTERS:
    - Target Style Filter: ${filters.style || 'Any'}
    - Weather context: ${filters.tempF ? `${filters.tempF}°F` : 'Any'}

    CORE GUIDELINES:
    1. The outfit MUST include at least one anchor item that explicitly fits the requested profile: "${filters.style || 'Any'}".
    2. Fill out the rest of the outfit combination using matching layers or standard neutral/casual basics.
    3. Obey strict logical boundaries: No formal blazers/suits with sweatpants, no high heels/heavy boots for beachwear or athletic filters.
    4. WRITE A UNIQUE DESCRIPTION: For every single outfit array element, write a charming, custom 1-2 sentence styling description explaining why these specific pieces match well together and hit the "${filters.style || 'Any'}" vibe. Never return generic placeholders.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: [
        { text: `Wardrobe Data: ${JSON.stringify(cleanWardrobe)}` },
        { text: prompt }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3, 
        // 2. Max out the token response capacity to give the structural engine tons of breathing room
        maxOutputTokens: 8192, 
        responseSchema: {
          type: Type.ARRAY,
          description: "List of styled outfit combinations matching the criteria",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Unique string combining the selected item IDs" },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              weatherNote: { type: Type.STRING, nullable: true },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    color: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["id", "title", "description", "items"]
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty text string returned from Gemini.");
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error generating AI description outfits:", error);
    throw error;
  }
}