-- ============================================================================
-- 05_chat_cache.sql
-- Human-in-the-loop AI Response Caching & Review Queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    normalized_question TEXT NOT NULL,
    lang VARCHAR(10) NOT NULL DEFAULT 'en',
    answer TEXT NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'gemini' CHECK (source IN ('curated', 'gemini')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    up_votes INTEGER NOT NULL DEFAULT 0,
    down_votes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ
);

-- Index for speedy retrieval of approved answers by language
CREATE INDEX IF NOT EXISTS idx_chat_cache_status_lang ON public.chat_cache (status, lang);
CREATE INDEX IF NOT EXISTS idx_chat_cache_normalized_question ON public.chat_cache (normalized_question);

-- Enable Row Level Security
ALTER TABLE public.chat_cache ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (authenticated and anon) can read APPROVED answers
CREATE POLICY "Anyone can read approved chat cache entries"
ON public.chat_cache
FOR SELECT
USING (status = 'approved');

-- 2. Authenticated users can insert pending candidates (no read access to others' pending items)
CREATE POLICY "Authenticated users can submit pending chat cache entries"
ON public.chat_cache
FOR INSERT
WITH CHECK (
    status = 'pending'
);

-- 3. Only Doctors and Admins can update status (approve / reject / edit)
CREATE POLICY "Admins and doctors can update chat cache entries"
ON public.chat_cache
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.providers
        WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.patients
        WHERE user_id = auth.uid() AND role IN ('admin', 'doctor')
    )
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'doctor')
);

-- 4. Admins and doctors can view all pending entries for review
CREATE POLICY "Admins and doctors can view pending entries for review"
ON public.chat_cache
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.providers
        WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.patients
        WHERE user_id = auth.uid() AND role IN ('admin', 'doctor')
    )
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'doctor')
);
