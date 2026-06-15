-- ============================================================
-- CEP Class Signups Table
-- Run this in the Supabase SQL editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.signups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  whatsapp    TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  class_date  TEXT        NOT NULL DEFAULT 'Wednesday 5-6 PM',
  paid        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can insert a signup
CREATE POLICY "signups_insert" ON public.signups
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (instructors) can read signups
CREATE POLICY "signups_read" ON public.signups
  FOR SELECT TO authenticated
  USING (true);

-- Only authenticated users can update (mark paid, etc.)
CREATE POLICY "signups_update" ON public.signups
  FOR UPDATE TO authenticated
  USING (true);
