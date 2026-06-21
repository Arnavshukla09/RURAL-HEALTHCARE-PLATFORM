-- Helper function to retrieve all tables in public schema
CREATE OR REPLACE FUNCTION public.get_tables()
RETURNS TABLE(table_name TEXT, row_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    schemaname || '.' || tablename as table_name,
    0::BIGINT as row_count
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tables() TO anon;
