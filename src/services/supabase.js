// src/services/supabase.js
// All database calls live here so pages don't talk to Supabase directly.
// Teresa: add new queries to this file as backend features come online.
// The VITE_ variables come from .env.local — never hardcode real keys here.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function requireUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('You must be signed in to save items.')
  return user.id
}

// ── Wardrobe items ────────────────────────────────────────────────────────────

// Pull every clothing item belonging to the logged-in user, newest first
export async function getWardrobeItems(userId) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Fetch a single item by its id — used on the edit page
export async function getWardrobeItem(id) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Save a new clothing item row. image_url is set separately after upload.
export async function addWardrobeItem(item) {
  const userId = await requireUserId()
  const payload = { ...item, user_id: item.user_id || userId }
  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}

// Update an existing item — only the fields passed in the `updates` object change
export async function updateWardrobeItem(id, updates) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Permanently remove a clothing item from the database
export async function deleteWardrobeItem(id) {
  const { error } = await supabase.from('wardrobe_items').delete().eq('id', id)
  if (error) throw error
}

// ── Image storage ─────────────────────────────────────────────────────────────

// Upload a photo to the clothing-images bucket and return its public URL.
// Files are stored under a folder named after the user's id to stay organised.
export async function uploadClothingImage(file, userId) {
  const ext  = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('clothing-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('clothing-images').getPublicUrl(path)
  return data.publicUrl
}

// ── Saved outfits ─────────────────────────────────────────────────────────────

// Bookmark an outfit the user wants to keep. outfit_data is a JSON array of item ids.
export async function saveOutfit(outfit) {
  const userId = await requireUserId()
  const payload = { ...outfit, user_id: outfit.user_id || userId }
  const { data, error } = await supabase
    .from('saved_outfits')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}

// Remove a saved outfit by its id
export async function deleteSavedOutfit(id) {
  const { error } = await supabase.from('saved_outfits').delete().eq('id', id)
  if (error) throw error
}

// ── User preferences ──────────────────────────────────────────────────────────

// Load saved style preferences for the profile page
export async function getUserPreferences(userId) {
  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

// Save or overwrite style preferences (upsert = insert if missing, update if exists)
export async function saveUserPreferences(userId, prefs) {
  const authUserId = await requireUserId()
  const payload = { user_id: authUserId, ...prefs }
  const { error } = await supabase
    .from('user_preferences')
    .upsert(payload)
  if (error) throw error
}
