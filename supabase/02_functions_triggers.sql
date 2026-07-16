-- ==========================================
-- 02_functions_triggers.sql
-- Database Functions & Triggers
-- ==========================================

-- 1. Helper function to avoid RLS recursion when checking roles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  role text;
BEGIN
  SELECT p.role INTO role FROM public.patients p WHERE p.user_id = auth.uid() LIMIT 1;
  RETURN role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY FIX: Revoke public execution
REVOKE EXECUTE ON FUNCTION public.get_user_role FROM PUBLIC, anon, authenticated;

-- 2. PostGIS auto-population trigger
CREATE OR REPLACE FUNCTION public.set_facility_geom()
RETURNS trigger AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_facility_geom ON healthcare_facilities;
CREATE TRIGGER trg_set_facility_geom
  BEFORE INSERT OR UPDATE OF lat, lon ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION public.set_facility_geom();

-- 3. Proximity search function for facilities
CREATE OR REPLACE FUNCTION public.nearby_facilities(
  p_lat double precision,
  p_lon double precision,
  p_type text DEFAULT NULL,
  p_radius_km double precision DEFAULT 25
)
RETURNS TABLE (
  id uuid, name text, type text, address text, phone text, district text, lat double precision, lon double precision, distance_km double precision
)
LANGUAGE sql STABLE SET search_path = public
AS $$
  SELECT f.id, f.name, f.type, f.address, f.phone, f.district, f.lat, f.lon,
    round((ST_Distance(f.geom, ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography) / 1000)::numeric, 1)::double precision AS distance_km
  FROM healthcare_facilities f
  WHERE ST_DWithin(f.geom, ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography, p_radius_km * 1000)
  AND (p_type IS NULL OR f.type = p_type)
  ORDER BY distance_km LIMIT 200;
$$;

-- 4. Auth Auto-create patient profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.patients (user_id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    '',
    'patient'
  )
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM PUBLIC, anon, authenticated;

-- Drop trigger first in case it exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_facility_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_facility_updated ON healthcare_facilities;
CREATE TRIGGER trg_facility_updated
  BEFORE UPDATE ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION public.update_facility_timestamp();
