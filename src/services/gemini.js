// src/services/gemini.js
import { GoogleGenAI, Type } from '@google/genai';

// Initialize the client using the modern SDK standard
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Generates structured outfit combinations using Gemini 2.5 Flash.
 */
export async function generateAIOutfit(items, filters = {}, maxResults = 12) {
  // Map items to a lighter version to save prompt tokens
  const cleanWardrobe = items.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    color: item.color,
    style: item.style || 'Casual',
    season: item.season || 'All seasons'
  }));
const prompt = `
    You are an expert fashion stylist. Look at this wardrobe and create up to ${maxResults} unique outfit combinations.
    
    CRITICAL FILTERING CONDITION:
    - Target Style: ${filters.style || 'Any'}
    - Target Temperature/Weather context: ${filters.tempF ? `${filters.tempF}°F` : 'Any'}

    STRICT STYLE RULES:
    1. If the Target Style is NOT 'Any', then EVERY single item included in an outfit MUST match that style category. 
    2. Do NOT mix a 'Formal' item into a 'Casual' outfit, or an 'Athletic' item into a 'Business' outfit.
    3. If an item in the wardrobe does not have a style tag or is empty, you may use it as a neutral basic filler item if needed.
    4. For EACH outfit, generate a unique, creative 'title' and 'description' highlighting its ${filters.style || 'style'} suitability.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { text: `Wardrobe Data: ${JSON.stringify(cleanWardrobe)}` },
        { text: prompt }
      ],
      config: {
        // Enforce strict JSON output with titles and descriptions
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 1000,
        candidateCount: 1,
        responseSchema: {

          maxOutputTokens: 1000,
          
          type: Type.ARRAY,
          description: "List of styled outfit combinations",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique string combining item IDs like 'id1-id2-id3'" },
              title: { type: Type.STRING, description: "A stylish, catchy title for the outfit (e.g., 'Urban Casual Neutrals')" },
              description: { type: Type.STRING, description: "A detailed description explaining why this outfit matches the filter, color palette, or vibe." },
              weatherNote: { type: Type.STRING, description: "Optional sentence about the weather suitability, or null." },
              items: {
                type: Type.ARRAY,
                description: "The list of item objects that make up this outfit",
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