// src/services/outfitEngine.js
import { generateAIOutfit } from './gemini';

const COLOR_COMPAT = {
  Black:      ['White', 'Gray', 'Beige', 'Red', 'Blue', 'Pink', 'Purple', 'Orange', 'Multicolor', 'Black'],
  White:      ['Black', 'Navy', 'Blue', 'Gray', 'Beige', 'Brown', 'Green', 'Pink', 'Red', 'White'],
  Gray:       ['Black', 'White', 'Navy', 'Blue', 'Pink', 'Purple', 'Beige', 'Gray'],
  Beige:      ['White', 'Brown', 'Black', 'Navy', 'Green', 'Beige'],
  Brown:      ['Beige', 'White', 'Green', 'Orange', 'Brown'],
  Navy:       ['White', 'Beige', 'Gray', 'Red', 'Orange', 'Pink', 'Navy'],
  Blue:       ['White', 'Beige', 'Gray', 'Brown', 'Orange', 'Blue'],
  Green:      ['White', 'Beige', 'Brown', 'Navy', 'Black', 'Orange', 'Green'],
  Red:        ['Black', 'White', 'Navy', 'Gray', 'Red'],
  Pink:       ['White', 'Gray', 'Navy', 'Black', 'Lavender', 'Pink'],
  Purple:     ['White', 'Gray', 'Black', 'Beige', 'Purple'],
  Yellow:     ['White', 'Gray', 'Navy', 'Black', 'Purple', 'Yellow'],
  Orange:     ['White', 'Navy', 'Brown', 'Black', 'Orange'],
  Multicolor: ['Black', 'White', 'Beige', 'Gray', 'Navy'],
};

function colorsMatch(colorA, colorB) {
  if (!colorA || !colorB) return true;
  if (colorA === colorB) return true;
  const allowed = COLOR_COMPAT[colorA];
  return allowed ? allowed.includes(colorB) : true;
}

const SEASON_COMPAT = {
  'All seasons': ['Spring', 'Summer', 'Fall', 'Winter', 'All seasons'],
  Spring:        ['All seasons', 'Spring'],
  Summer:        ['All seasons', 'Summer'],
  Fall:          ['All seasons', 'Fall'],
  Winter:        ['All seasons', 'Winter'],
};

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

function createOfflineDescription(items, targetStyle) {
  const styleStr = targetStyle && targetStyle !== 'Any' ? targetStyle : 'Everyday';
  const styleLower = styleStr.toLowerCase();

  const mainPiece   = items.find(i => i.category === 'Tops' || i.category === 'Dresses');
  const bottomPiece = items.find(i => i.category === 'Bottoms');
  const shoePiece   = items.find(i => i.category === 'Shoes');

  const mainName   = mainPiece   ? mainPiece.name.toLowerCase()   : 'essential piece';
  const bottomName = bottomPiece ? bottomPiece.name.toLowerCase() : 'bottoms';
  const shoeName   = shoePiece   ? shoePiece.name.toLowerCase()   : 'matching shoes';

  const templates = [
    `A clean, coordinated ${styleLower} layout highlighting your ${mainName} and ${shoeName}.`,
    `Effortless ${styleLower} aesthetic centering around your ${mainName} for a balanced look.`,
    `A sleek ${styleLower} ensemble pairing your ${mainName} seamlessly with ${bottomPiece ? bottomName : shoeName}.`,
    `Versatile and structured: built around your ${mainName} with complementary color tones.`,
    `A minimalist ${styleLower} combination focusing on your ${mainName} and coordinated footwear.`,
    `Elevated ${styleLower} silhouette featuring your ${mainName} alongside matching accents.`,
    `A polished ${styleLower} arrangement that brings your ${mainName} into clear focus.`,
    `Comfortable yet tailored: anchoring a ${styleLower} vibe with your ${mainName}.`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function createOfflineTitle(items, targetStyle) {
  const styleStr = targetStyle && targetStyle !== 'Any' ? targetStyle : 'Everyday';
  const modifiers = ['Minimalist', 'Classic', 'Street', 'Curated', 'Essential', 'Urban'];
  const chosenMod = modifiers[Math.floor(Math.random() * modifiers.length)];
  return `${chosenMod} ${styleStr} Selection`;
}

/**
 * Rule-Based Backup Generator (Strict Local Fallback)
 */
export function generateOutfits(items, filters = {}, maxResults = 12) {
  const { style, tempF } = filters;
  const season = tempF != null ? tempToSeason(tempF) : 'All seasons';

  const tops        = items.filter(i => i.category === 'Tops'        && seasonMatch(i.season, season));
  const bottoms     = items.filter(i => i.category === 'Bottoms'     && seasonMatch(i.season, season));
  const dresses     = items.filter(i => i.category === 'Dresses'     && seasonMatch(i.season, season));
  const shoes       = items.filter(i => i.category === 'Shoes'       && seasonMatch(i.season, season));

  const outfits = [];
  const seen    = new Set();
  const maxTries = maxResults * 30;

  for (let i = 0; i < maxTries && outfits.length < maxResults; i++) {
    const outfitItems = [];

    const useDress = dresses.length > 0 && Math.random() > 0.5;
    if (useDress) {
      const dress = pick(dresses);
      if (dress) outfitItems.push(dress);
    } else {
      const top    = pick(tops);
      const bottom = pick(bottoms);
      if (!top || !bottom) continue;
      
      // STRICT COLOR MATCH
      if (!colorsMatch(top.color, bottom.color)) continue;

      outfitItems.push(top, bottom);
    }

    const shoe = pick(shoes);
    if (shoe) {
      // STRICT COLOR MATCH SHOE AGAINST TOP/DRESS
      const anchorItem = outfitItems[0];
      if (anchorItem && !colorsMatch(anchorItem.color, shoe.color)) continue;
      outfitItems.push(shoe);
    }

    const key = outfitItems.map(it => it.id).sort().join('-');
    if (seen.has(key)) continue;
    seen.add(key);

    outfits.push({
      id: key,
      title: createOfflineTitle(outfitItems, style),
      description: createOfflineDescription(outfitItems, style),
      season: season,
      items: outfitItems,
    });
  }

  return outfits;
}

/**
 * Main Smart Engine Entry
 */
export async function getSmartOutfits(items, filters = {}, maxResults = 12) {
  if (!items || items.length === 0) return [];

  const targetStyle = (filters.style && filters.style !== 'Any') ? filters.style.toLowerCase() : null;

  // 🛡️ STRICT PRE-FILTER: Keep ONLY items whose style strictly matches targetStyle (or "All")
  const safeItems = items.filter(item => {
    if (!targetStyle) return true;
    
    const itemStyle = String(item.style || item.style_type || '').toLowerCase().trim();
    return itemStyle === targetStyle || itemStyle === 'all' || itemStyle === 'any';
  });

  // If there are no matching items for this style, return an empty list immediately
  if (safeItems.length === 0) return [];

  try {
    const rawResult = await generateAIOutfit(safeItems, filters, maxResults);
    let apiOutfits = Array.isArray(rawResult) ? rawResult : [];

    if (apiOutfits.length === 0) throw new Error("Zero outfit records returned by Gemini API.");

    const completeOutfits = apiOutfits.map(outfit => {
      const detailedItems = outfit.items.map(aiItem => {
        return safeItems.find(original => String(original.id) === String(aiItem.id));
      }).filter(Boolean);

      if (detailedItems.length === 0) return null;

      return {
        ...outfit,
        items: detailedItems
      };
    }).filter(Boolean);

    if (completeOutfits.length === 0) throw new Error("Failed to resolve outfit items.");

    return completeOutfits;

  } catch (error) {
    console.warn("API bypass or rate limit encountered. Running strict local fallback algorithm:", error);
    return generateOutfits(safeItems, filters, maxResults).map(outfit => ({
      ...outfit,
      isFallback: true
    }));
  }
}