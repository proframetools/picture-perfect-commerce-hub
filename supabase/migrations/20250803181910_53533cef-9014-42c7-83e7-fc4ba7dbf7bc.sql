-- Clean up redundant and unused Supabase tables

-- Drop redundant frame_aspect_ratios table (we already have aspect_ratios)
DROP TABLE IF EXISTS public.frame_aspect_ratios CASCADE;

-- Drop unused feature tables
DROP TABLE IF EXISTS public.popular_combinations CASCADE;
DROP TABLE IF EXISTS public.product_occasions CASCADE;
DROP TABLE IF EXISTS public.product_tags CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;

-- Drop the junction table for occasions since we're removing product_occasions
DROP TABLE IF EXISTS public.occasions CASCADE;

-- Drop the tags table since we're removing product_tags
DROP TABLE IF EXISTS public.tags CASCADE;

-- Clean up empty asset tables that aren't being used properly
DROP TABLE IF EXISTS public.frame_assets CASCADE;
DROP TABLE IF EXISTS public.preview_images CASCADE;