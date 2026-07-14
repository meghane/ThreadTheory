-- =====================================================
-- ThreadTheory · Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Wardrobe items
create table if not exists wardrobe_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  category    text,          -- Tops | Bottoms | Outerwear | Shoes | Accessories | Dresses | Other
  color       text,          -- primary color label
  style       text,          -- Casual | Formal | Athletic …
  season      text default 'All seasons',
  brand       text,
  description text,          -- user's free-text description
  image_url   text,          -- public URL from Supabase Storage
  created_at  timestamptz default now()
);

-- Row-level security: users can only see & edit their own items
alter table wardrobe_items enable row level security;
create policy "Own wardrobe only" on wardrobe_items
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Saved outfits
create table if not exists saved_outfits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  outfit_data  text,          -- JSON array of wardrobe_item ids
  label        text,
  weather_note text,
  created_at   timestamptz default now()
);

alter table saved_outfits enable row level security;
create policy "Own saved outfits only" on saved_outfits
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. User preferences
create table if not exists user_preferences (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  style_prefs text[] default '{}',   -- array of preferred style strings
  updated_at  timestamptz default now()
);

alter table user_preferences enable row level security;
create policy "Own preferences only" on user_preferences
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================
-- Storage bucket for clothing images
-- Run in: Supabase Dashboard → Storage → New bucket
--   Bucket name: clothing-images
--   Public: true
--   File size limit: 10 MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
-- =====================================================
