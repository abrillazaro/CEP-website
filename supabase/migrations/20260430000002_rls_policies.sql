-- ============================================================
-- CEP — Row Level Security Policies
-- ============================================================

-- Helper: returns TRUE when the calling user's role is 'teacher'.
-- SECURITY DEFINER lets it read public.users without hitting RLS,
-- preventing the infinite-recursion problem.
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN LANGUAGE sql
SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$;


-- ── USERS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Students read their own profile
CREATE POLICY "users: read own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Teachers read all profiles
CREATE POLICY "users: teacher reads all"
  ON public.users FOR SELECT
  USING (is_teacher());

-- Any authenticated user updates only their own profile
CREATE POLICY "users: update own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- (INSERT is handled by the handle_new_user trigger running as SECURITY DEFINER)


-- ── SESSIONS ─────────────────────────────────────────────────────────────────

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: student reads own"
  ON public.sessions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "sessions: teacher reads all"
  ON public.sessions FOR SELECT
  USING (is_teacher());

-- Only teachers can create or edit sessions / notes
CREATE POLICY "sessions: teacher inserts"
  ON public.sessions FOR INSERT
  WITH CHECK (is_teacher());

CREATE POLICY "sessions: teacher updates"
  ON public.sessions FOR UPDATE
  USING (is_teacher());


-- ── MATERIALS ────────────────────────────────────────────────────────────────

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view materials
CREATE POLICY "materials: authenticated reads"
  ON public.materials FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only teachers can upload, edit, or delete materials
CREATE POLICY "materials: teacher inserts"
  ON public.materials FOR INSERT
  WITH CHECK (is_teacher());

CREATE POLICY "materials: teacher updates"
  ON public.materials FOR UPDATE
  USING (is_teacher());

CREATE POLICY "materials: teacher deletes"
  ON public.materials FOR DELETE
  USING (is_teacher());


-- ── DRILL ACTIVITY ───────────────────────────────────────────────────────────

ALTER TABLE public.drill_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drill_activity: student reads own"
  ON public.drill_activity FOR SELECT
  USING (auth.uid() = student_id);

-- Students write only their own rows
CREATE POLICY "drill_activity: student inserts own"
  ON public.drill_activity FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "drill_activity: teacher reads all"
  ON public.drill_activity FOR SELECT
  USING (is_teacher());


-- ── PROGRESS ─────────────────────────────────────────────────────────────────

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress: student reads own"
  ON public.progress FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "progress: student inserts own"
  ON public.progress FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "progress: student updates own"
  ON public.progress FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "progress: teacher reads all"
  ON public.progress FOR SELECT
  USING (is_teacher());
