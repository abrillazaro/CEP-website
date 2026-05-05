-- ============================================================
-- CEP — Create Tables
-- ============================================================

-- Users / Profiles
-- Extends auth.users with CEP-specific fields.
-- A trigger (below) auto-inserts a row here on every new signup.
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT        UNIQUE NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'student'
                          CHECK (role IN ('teacher', 'student')),
  level       TEXT        CHECK (level IN ('basic', 'beginner', 'intermediate')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  teacher_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Materials
CREATE TABLE IF NOT EXISTS public.materials (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  file_url    TEXT,
  level       TEXT        CHECK (level IN ('basic', 'beginner', 'intermediate')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drill Activity
CREATE TABLE IF NOT EXISTS public.drill_activity (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  level       TEXT        CHECK (level IN ('basic', 'beginner', 'intermediate')),
  score       INTEGER,
  streak      INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Progress (one row per student, upserted after each session)
CREATE TABLE IF NOT EXISTS public.progress (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  understanding_score INTEGER     NOT NULL DEFAULT 0,
  speaking_score      INTEGER     NOT NULL DEFAULT 0,
  satisfaction_score  INTEGER     NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT progress_student_unique UNIQUE (student_id)
);

-- Auto-update progress.updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS progress_set_updated_at ON public.progress;
CREATE TRIGGER progress_set_updated_at
  BEFORE UPDATE ON public.progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Auto-create a profile row when a new auth user signs up ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
