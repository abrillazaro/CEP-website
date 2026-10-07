-- ============================================================
-- CEP — Mexico transfer-enrollment table + RLS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.enrollments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  whatsapp    TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  course_key  TEXT        NOT NULL
                          CHECK (course_key IN ('monwed', 'friday', 'beginnerMonWed', 'beginnerFriday')),
  class_label TEXT        NOT NULL,
  about_me    TEXT,
  status      TEXT        NOT NULL DEFAULT 'Pendiente'
                          CHECK (status IN ('Pendiente', 'Pagado')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper: TRUE only for the one admin account (by email), checked against
-- auth.users directly so it works independent of the public.users/role
-- system used elsewhere on the site. SECURITY DEFINER so it can read
-- auth.users without itself being subject to RLS.
CREATE OR REPLACE FUNCTION public.is_enrollments_admin()
RETURNS BOOLEAN LANGUAGE sql
SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND email = 'abrillazarodmc@gmail.com'
  );
$$;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can submit a new enrollment, but
-- only ever as "Pendiente" — nobody can insert a row that's already "Pagado".
CREATE POLICY "enrollments: public inserts as pending"
  ON public.enrollments FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'Pendiente');

-- Only the admin account can ever read the list.
CREATE POLICY "enrollments: admin reads"
  ON public.enrollments FOR SELECT
  USING (public.is_enrollments_admin());

-- Only the admin account can change status (Pendiente <-> Pagado).
CREATE POLICY "enrollments: admin updates"
  ON public.enrollments FOR UPDATE
  USING (public.is_enrollments_admin())
  WITH CHECK (public.is_enrollments_admin());
