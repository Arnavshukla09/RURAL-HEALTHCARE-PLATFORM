-- ============================================================
-- 006_facilities_postgis.sql
-- Creates the healthcare_facilities table with PostGIS spatial
-- indexing and a proximity search function.
-- Run this in: Supabase → SQL Editor
-- ============================================================

-- 1. Enable PostGIS extension (safe to re-run)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create the healthcare_facilities table
CREATE TABLE IF NOT EXISTS healthcare_facilities (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  osm_id      bigint UNIQUE,                       -- OpenStreetMap node/way ID (dedup key)
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('hospital','clinic','doctors','pharmacy','lab','health_post')),
  address     text,
  phone       text,
  district    text,
  state       text DEFAULT 'Madhya Pradesh',
  lat         double precision NOT NULL,
  lon         double precision NOT NULL,
  geom        geography(Point, 4326),               -- PostGIS geography column
  tags        jsonb DEFAULT '{}',                    -- raw OSM tags for future use
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 3. Auto-populate geom from lat/lon on insert/update
CREATE OR REPLACE FUNCTION set_facility_geom()
RETURNS trigger AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_facility_geom ON healthcare_facilities;
CREATE TRIGGER trg_set_facility_geom
  BEFORE INSERT OR UPDATE OF lat, lon ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION set_facility_geom();

-- 4. Spatial index for fast proximity queries
CREATE INDEX IF NOT EXISTS idx_facilities_geom ON healthcare_facilities USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON healthcare_facilities (type);

-- 5. Proximity search function — returns facilities within radius_km of a point
CREATE OR REPLACE FUNCTION nearby_facilities(
  p_lat double precision,
  p_lon double precision,
  p_type text DEFAULT NULL,
  p_radius_km double precision DEFAULT 25
)
RETURNS TABLE (
  id          uuid,
  name        text,
  type        text,
  address     text,
  phone       text,
  district    text,
  lat         double precision,
  lon         double precision,
  distance_km double precision
)
LANGUAGE sql STABLE
AS $$
  SELECT
    f.id,
    f.name,
    f.type,
    f.address,
    f.phone,
    f.district,
    f.lat,
    f.lon,
    round((ST_Distance(
      f.geom,
      ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
    ) / 1000)::numeric, 1)::double precision AS distance_km
  FROM healthcare_facilities f
  WHERE ST_DWithin(
    f.geom,
    ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
    p_radius_km * 1000  -- ST_DWithin uses meters for geography
  )
  AND (p_type IS NULL OR f.type = p_type)
  ORDER BY distance_km
  LIMIT 200;
$$;

-- 6. RLS — facilities are public read for all users
ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facilities_public_read" ON healthcare_facilities
  FOR SELECT USING (true);

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION update_facility_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_facility_updated ON healthcare_facilities;
CREATE TRIGGER trg_facility_updated
  BEFORE UPDATE ON healthcare_facilities
  FOR EACH ROW EXECUTE FUNCTION update_facility_timestamp();
