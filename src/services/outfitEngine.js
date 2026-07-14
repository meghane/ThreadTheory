// src/services/outfitEngine.js
import { generateAIOutfit } from './gemini';

const COLOR_COMPAT = {
  Black:      ['White', 'Gray', 'Beige', 'Red', 'Blue', 'Pink', 'Purple', 'Orange', 'Multicolor'],
  White:      ['Black', 'Navy', 'Blue', 'Gray', 'Beige', 'Brown', 'Green', 'Pink', 'Red'],
  Gray:       ['Black', 'White', 'Navy', 'Blue', 'Pink', 'Purple', 'Beige'],
  Beige:      ['White', 'Brown', 'Black', 'Navy', 'Green'],
  Brown:      ['Beige', 'White', 'Green', 'Orange'],
  Navy:       ['White', 'Beige', 'Gray', 'Red', 'Orange', 'Pink'],
  Blue:       ['White', 'Beige', 'Gray', 'Brown', 'Orange'],
  Green:      ['White', 'Beige', 'Brown', 'Navy', 'Black', 'Orange'],
  Red:        ['Black', 'White', 'Navy', 'Gray'],
  Pink:       ['White', 'Gray', 'Navy', 'Black', 'Lavender'],
  Purple:     ['White', 'Gray', 'Black', 'Beige'],
  Yellow:     ['White', 'Gray', 'Navy', 'Black', 'Purple'],
  Orange:     ['White', 'Navy', 'Brown', 'Black'],
  Multicolor: ['Black', 'White', 'Beige', 'Gray', 'Navy'],
}

function colorsMatch(a, b) {
  if (!a || !b) return true;
  if (a === b) return true;
  return (COLOR_COMPAT[a] || []).includes(b);
}

const SEASON_COMPAT = {
  'All seasons': ['Spring', 'Summer', 'Fall', 'Winter', 'All seasons'],
  Spring:        ['All seasons', 'Spring'],
  Summer:        ['All seasons', 'Summer'],
  Fall:          ['All seasons', 'Fall'],
  Winter:        ['All seasons', 'Winter'],
}

function seasonMatch(itemSeason, filterSeason) {
  if (!filterSeason || filterSeason === 'All seasons') return true;
  return SEASON_COMPAT[filterSeason]?.includes(itemSeason ?? 'All seasons');
}

function tempToSeason(tempF) {
  if (tempF < 40) return 'Winter';
  if (tempF < 58) return 'Fall';
  if (tempF < 75) return 'Spring';
  return 'Summer';
}

function pick(arr) {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

// Helper to find the style property on an item regardless of DB naming schema
function getItemStyle(item) {
  if (!item) return '';
  const styleValue = item.style || item.style_type || item.styleCategory || item.tags || '';
  if (Array.isArray(styleValue)) {
    return styleValue.map(s => String(s).toLowerCase());
  }
  return String(styleValue).toLowerCase();
}

/**
 * Rule-Based Backup Generator
 */
export function generateOutfits(items, filters = {}, maxResults = 12) {
  const { style, tempF } = filters;
  const season = tempF != null ? tempToSeason(tempF) : 'All seasons';
  const isCold = tempF != null && tempF < 58;

  const tops        = items.filter(i => i.category === 'Tops'        && seasonMatch(i.season, season));
  const bottoms     = items.filter(i => i.category === 'Bottoms'     && seasonMatch(i.season, season));
  const outerwear   = items.filter(i => i.category === 'Outerwear'   && seasonMatch(i.season, season));
  const dresses     = items.filter(i => i.category === 'Dresses'     && seasonMatch(i.season, season));
  const shoes       = items.filter(i => i.category === 'Shoes'       && seasonMatch(i.season, season));
  const accessories = items.filter(i => i.category === 'Accessories' && seasonMatch(i.season, season));

  const outfits = [];
  const seen    = new Set();
  const tries   = maxResults * 10;

  for (let i = 0; i < tries && outfits.length < maxResults; i++) {
    const outfit = { items: [] };

    const useDress = dresses.length > 0 && Math.random() > 0.5;
    if (useDress) {
      const dress = pick(dresses);
      if (dress) outfit.items.push(dress);
    } else {
      const top    = pick(tops);
      const bottom = pick(bottoms);
      if (!top || !bottom) continue;
      if (!colorsMatch(top.color, bottom.color)) continue;
      outfit.items.push(top, bottom);
    }

    if (isCold && outerwear.length > 0 && Math.random() > 0.3) {
      const outer = pick(outerwear);
      if (outer) outfit.items.push(outer);
    }

    const shoe = pick(shoes);
    if (shoe) outfit.items.push(shoe);

    if (accessories.length > 0 && Math.random() > 0.6) {
      const acc = pick(accessories);
      if (acc) outfit.items.push(acc);
    }

    // FIXED: Safely check if style exists and is a valid string before transforming
    if (typeof style === 'string' && style.trim() !== '' && style.toLowerCase() !== 'any') {
      const targetStyle = style.toLowerCase();
      const hasMismatch = outfit.items.some(item => {
        const itemStyle = getItemStyle(item);
        if (!itemStyle) return false; // Allow unstyled items as neutral basics
        if (Array.isArray(itemStyle)) {
          return !itemStyle.includes(targetStyle);
        }
        return itemStyle !== targetStyle;
      });
      if (hasMismatch) continue;
    }

    const key = outfit.items.map(it => it.id).sort().join('-');
    if (seen.has(key)) continue;
    seen.add(key);

    outfit.id          = key;
    outfit.season      = season;
    outfit.weatherNote = tempF != null ? `For ${Math.round(tempF)}°F weather (${season})` : null;
    outfit.title       = "Classic Combination";
    outfit.description = "A reliable style combo selected directly from your seasonal wardrobe parameters.";

    outfits.push(outfit);
  }

  return outfits;
}

/**
 * Intelligent Wrapper
 */
export async function getSmartOutfits(items, filters = {}, maxResults = 12) {
  if (!items || items.length === 0) {
    return [];
  }

  // Diagnostic Logs
  console.log("=== DIAGNOSTIC: CURRENT WARDROBE DATABASE ITEMS ===");
  console.table(items.slice(0, 5).map(i => ({
    id: i.id,
    name: i.name,
    category: i.category,
    style_property: i.style || "NOTHING FOUND",
    all_keys: Object.keys(i).join(", ")
  })));
  console.log("Active Filtering Criteria:", filters);

  try {
    const rawResult = await generateAIOutfit(items, filters, maxResults);
    let apiOutfits = [];
    
    if (Array.isArray(rawResult)) {
      apiOutfits = rawResult;
    } else if (rawResult && typeof rawResult === 'object') {
      const extractedArray = Object.values(rawResult).find(val => Array.isArray(val));
      if (extractedArray) {
        apiOutfits = extractedArray;
      }
    }

    if (!apiOutfits || apiOutfits.length === 0) {
      throw new Error("No structured outfit arrays returned.");
    }

    const completeOutfits = apiOutfits.map(outfit => {
      const detailedItems = outfit.items
        .map(aiItem => items.find(original => original.id === aiItem.id))
        .filter(Boolean);

      if (detailedItems.length === 0) return null;

      // FIXED: Safely verify type before applying filter safety check
      if (typeof filters.style === 'string' && filters.style.trim() !== '' && filters.style.toLowerCase() !== 'any') {
        const targetStyle = filters.style.toLowerCase();
        
        const hasMismatchedStyle = detailedItems.some(item => {
          const itemStyle = getItemStyle(item);
          if (!itemStyle) return false; 
          
          if (Array.isArray(itemStyle)) {
            return !itemStyle.includes(targetStyle);
          }
          return itemStyle !== targetStyle;
        });

        if (hasMismatchedStyle) {
          console.log(`Pruned AI outfit because it contained items mismatching the "${filters.style}" filter.`);
          return null; 
        }
      }

      return {
        ...outfit,
        items: detailedItems
      };
    }).filter(Boolean);

    if (completeOutfits.length === 0) {
      throw new Error("All generated Gemini options failed style safety checks.");
    }

    return completeOutfits;

  } catch (error) {
    console.warn("Fell back to rule engine:", error.message);
    
    const fallbackOutfits = generateOutfits(items, filters, maxResults);
    return fallbackOutfits.map(outfit => ({
      ...outfit,
      isFallback: true
    }));
  }
}