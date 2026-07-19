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

function getItemStyle(item) {
  if (!item) return '';
  const styleValue = item.style || item.style_type || item.styleCategory || item.tags || '';
  if (Array.isArray(styleValue)) {
    return styleValue.map(s => String(s).toLowerCase());
  }
  return String(styleValue).toLowerCase();
}

/**
 * Generates fun fallback copy locally without consuming API tokens
 */
function createOfflineDescription(items, targetStyle) {
  const styleStr = targetStyle && targetStyle !== 'Any' ? targetStyle : 'Everyday';
  const mainPiece = items.find(i => i.category === 'Tops' || i.category === 'Dresses');
  const shoePiece = items.find(i => i.category === 'Shoes');
  
  const combinations = [
    `A clean, coordinated ${styleStr.toLowerCase()} layout highlighting your ${mainPiece ? mainPiece.name.toLowerCase() : 'essential items'} and matching shoes.`,
    `Perfect setup for an easygoing day out, anchoring a streamlined ${styleStr.toLowerCase()} style architecture.`,
    `A balanced pairing combining functional comfort with a smart aesthetic palette.`
  ];
  
  return combinations[Math.floor(Math.random() * combinations.length)];
}

function createOfflineTitle(items, targetStyle) {
  const styleStr = targetStyle && targetStyle !== 'Any' ? targetStyle : 'Everyday';
  const modifiers = ['Minimalist', 'Classic', 'Street', 'Curated', 'Essential', 'Urban'];
  const chosenMod = modifiers[Math.floor(Math.random() * modifiers.length)];
  return `${chosenMod} ${styleStr} Selection`;
}

/**
 * 🛡️ COMPREHENSIVE CONTEXT GATEKEEPER
 */
function isOutfitLogicallyValid(outfitItems, targetStyle) {
  if (!targetStyle || typeof targetStyle !== 'string') return true;
  const styleLower = targetStyle.toLowerCase();

  const names = outfitItems.map(i => (i.name || '').toLowerCase());

  if (styleLower === 'athletic') {
    const hasInvalidShoe = names.some(n => 
      n.includes('sandal') || n.includes('flop') || n.includes('heel') || 
      n.includes('pump') || n.includes('wedge') || n.includes('boot') || 
      n.includes('oxford') || n.includes('loafer') || n.includes('slide')
    );
    const hasInvalidClothing = names.some(n => 
      n.includes('blazer') || n.includes('suit') || n.includes('button down') || 
      n.includes('tuxedo') || n.includes('pencil skirt') || n.includes('dress pants')
    );
    if (hasInvalidShoe || hasInvalidClothing) return false;
  }
  
  if (styleLower === 'beach') {
    const hasInvalidShoe = names.some(n => 
      n.includes('heel') || n.includes('pump') || n.includes('wedge') || 
      n.includes('combat') || n.includes('winter boot') || n.includes('oxford')
    );
    const hasInvalidClothing = names.some(n => 
      n.includes('heavy coat') || n.includes('parka') || n.includes('blazer') || 
      n.includes('trench') || n.includes('thermal') || n.includes('suit')
    );
    if (hasInvalidShoe || hasInvalidClothing) return false;
  }

  if (styleLower === 'business' || styleLower === 'formal') {
    const hasInvalidItems = names.some(n => 
      n.includes('sweatpant') || n.includes('jogger') || n.includes('flip flop') || 
      n.includes('crocs') || n.includes('jersey') || n.includes('tracksuit') ||
      n.includes('running shorts')
    );
    if (hasInvalidItems) return false;
  }

  return true;
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
  const tries   = maxResults * 20;

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

    const acc = pick(accessories);
    if (accessories.length > 0 && Math.random() > 0.6) {
      if (acc) outfit.items.push(acc);
    }

    if (!isOutfitLogicallyValid(outfit.items, style)) continue;

    if (typeof style === 'string' && style.trim() !== '' && style.toLowerCase() !== 'any') {
      const targetStyle = style.toLowerCase();
      
      const hasAnyStyleMatch = outfit.items.some(item => {
        const itemStyle = getItemStyle(item);
        return Array.isArray(itemStyle) ? itemStyle.includes(targetStyle) : itemStyle === targetStyle;
      });

      if (!hasAnyStyleMatch) continue;
    }

    const key = outfit.items.map(it => it.id).sort().join('-');
    if (seen.has(key)) continue;
    seen.add(key);

    outfit.id          = key;
    outfit.title       = createOfflineTitle(outfit.items, style);
    outfit.description = createOfflineDescription(outfit.items, style);
    outfit.season      = season;
    outfit.weatherNote = tempF != null ? `For ${Math.round(tempF)}°F weather (${season})` : null;

    outfits.push(outfit);
  }

  return outfits;
}

/**
 * Intelligent Wrapper Layer
 */
export async function getSmartOutfits(items, filters = {}, maxResults = 15) {
  if (!items || items.length === 0) return [];

  try {
    console.log("--- 🧠 ENGINE DIAGNOSTIC START ---");
    
    const rawResult = await generateAIOutfit(items, filters, maxResults);
    let apiOutfits = Array.isArray(rawResult) ? rawResult : [];
    
    if (apiOutfits.length === 0) {
      throw new Error("Zero outfit records returned by Gemini API.");
    }

    const completeOutfits = apiOutfits.map((outfit, idx) => {
      const detailedItems = outfit.items.map(aiItem => {
        return items.find(original => String(original.id) === String(aiItem.id));
      }).filter(Boolean);

      if (detailedItems.length === 0 || detailedItems.length !== outfit.items.length) {
        return null;
      }

      if (!isOutfitLogicallyValid(detailedItems, filters.style)) {
        return null;
      }

      if (typeof filters.style === 'string' && filters.style.trim() !== '' && filters.style.toLowerCase() !== 'any') {
        const targetStyle = filters.style.toLowerCase();
        const hasAnchorStyle = detailedItems.some(item => {
          const itemStyle = getItemStyle(item);
          return Array.isArray(itemStyle) ? itemStyle.includes(targetStyle) : itemStyle === targetStyle;
        });

        if (!hasAnchorStyle) return null;
      }

      return {
        ...outfit,
        items: detailedItems
      };
    }).filter(Boolean);

    if (completeOutfits.length === 0) {
      throw new Error("All generated outfits were vetoed by programmatic filters.");
    }

    return completeOutfits;

  } catch (error) {
    console.warn("API layer route bypass (Quota hit or connection error). Using custom offline copywriting script instead.");
    
    return generateOutfits(items, filters, maxResults).map(outfit => ({
      ...outfit,
      isFallback: true
    }));
  }
}