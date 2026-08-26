-- Grant SELECT permission on the downloadable_asset_url column to authenticated users
GRANT SELECT (downloadable_asset_url) ON public.lessons TO authenticated;
