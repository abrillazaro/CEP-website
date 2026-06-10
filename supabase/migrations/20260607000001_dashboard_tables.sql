-- ============================================================
-- CEP Dashboard Tables
-- Run this in the Supabase SQL editor if tables don't exist yet.
-- ============================================================

-- Feed posts (class social feed)
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id   TEXT,
  author_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name   TEXT        NOT NULL DEFAULT '',
  color       TEXT,
  role        TEXT        NOT NULL DEFAULT 'student',
  body        TEXT        NOT NULL DEFAULT '',
  media       JSONB       NOT NULL DEFAULT '[]',
  pinned      BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feed comments
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name   TEXT        NOT NULL DEFAULT '',
  color       TEXT,
  role        TEXT        NOT NULL DEFAULT 'student',
  body        TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feed likes
CREATE TABLE IF NOT EXISTS public.feed_likes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- Announcements (instructor-only, 7-day TTL enforced in app)
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name   TEXT        NOT NULL DEFAULT '',
  color       TEXT,
  title       TEXT        NOT NULL DEFAULT '',
  body        TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  due         TIMESTAMPTZ,
  points      INTEGER     NOT NULL DEFAULT 100,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Submissions (one per student per assignment)
CREATE TABLE IF NOT EXISTS public.submissions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID        NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            TEXT        NOT NULL DEFAULT '',
  files           JSONB       NOT NULL DEFAULT '[]',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  grade_score     INTEGER,
  grade_feedback  TEXT,
  graded_at       TIMESTAMPTZ,
  UNIQUE (assignment_id, student_id)
);

-- Meetings (live class sessions)
CREATE TABLE IF NOT EXISTS public.meetings (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  duration_min  INTEGER     NOT NULL DEFAULT 30,
  link          TEXT        NOT NULL DEFAULT '',
  host          TEXT        NOT NULL DEFAULT '',
  recording_url TEXT        NOT NULL DEFAULT '',
  created_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS feed_comments_post_id_idx  ON public.feed_comments(post_id);
CREATE INDEX IF NOT EXISTS feed_likes_post_id_idx     ON public.feed_likes(post_id);
CREATE INDEX IF NOT EXISTS submissions_assign_idx     ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS submissions_student_idx    ON public.submissions(student_id);

-- Enable RLS
ALTER TABLE public.feed_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings      ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────────────────────

-- Helper: is the current user a teacher?
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher');
$$;

-- feed_posts: all authenticated users read; authors delete own; anyone can post
CREATE POLICY "fp_read"   ON public.feed_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "fp_insert" ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "fp_delete" ON public.feed_posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR is_teacher());
CREATE POLICY "fp_update" ON public.feed_posts FOR UPDATE TO authenticated USING (author_id = auth.uid() OR is_teacher());

-- feed_comments: all authenticated read; authors insert/delete own
CREATE POLICY "fc_read"   ON public.feed_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "fc_insert" ON public.feed_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "fc_delete" ON public.feed_comments FOR DELETE TO authenticated USING (author_id = auth.uid() OR is_teacher());

-- feed_likes: all authenticated read; users manage own
CREATE POLICY "fl_read"   ON public.feed_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "fl_insert" ON public.feed_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "fl_delete" ON public.feed_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- announcements: all authenticated read; teachers write
CREATE POLICY "ann_read"   ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "ann_insert" ON public.announcements FOR INSERT TO authenticated WITH CHECK (is_teacher());
CREATE POLICY "ann_delete" ON public.announcements FOR DELETE TO authenticated USING (author_id = auth.uid() OR is_teacher());

-- assignments: all authenticated read; teachers create/delete
CREATE POLICY "asgn_read"   ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "asgn_insert" ON public.assignments FOR INSERT TO authenticated WITH CHECK (is_teacher());
CREATE POLICY "asgn_update" ON public.assignments FOR UPDATE TO authenticated USING (is_teacher());
CREATE POLICY "asgn_delete" ON public.assignments FOR DELETE TO authenticated USING (is_teacher());

-- submissions: students see own; teachers see all
CREATE POLICY "sub_read"   ON public.submissions FOR SELECT TO authenticated USING (student_id = auth.uid() OR is_teacher());
CREATE POLICY "sub_insert" ON public.submissions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "sub_update" ON public.submissions FOR UPDATE TO authenticated USING (student_id = auth.uid() OR is_teacher());
CREATE POLICY "sub_delete" ON public.submissions FOR DELETE TO authenticated USING (student_id = auth.uid() OR is_teacher());

-- meetings: all authenticated read; teachers write
CREATE POLICY "meet_read"   ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "meet_insert" ON public.meetings FOR INSERT TO authenticated WITH CHECK (is_teacher());
CREATE POLICY "meet_update" ON public.meetings FOR UPDATE TO authenticated USING (is_teacher());
CREATE POLICY "meet_delete" ON public.meetings FOR DELETE TO authenticated USING (is_teacher());

-- ── Realtime ──────────────────────────────────────────────────────────────────
-- REPLICA IDENTITY FULL lets postgres_changes carry the old row on UPDATE/DELETE.
ALTER TABLE public.feed_posts    REPLICA IDENTITY FULL;
ALTER TABLE public.feed_comments REPLICA IDENTITY FULL;
ALTER TABLE public.feed_likes    REPLICA IDENTITY FULL;
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER TABLE public.assignments   REPLICA IDENTITY FULL;
ALTER TABLE public.submissions   REPLICA IDENTITY FULL;
ALTER TABLE public.meetings      REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication so postgres_changes events fire.
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.feed_posts,
  public.feed_comments,
  public.feed_likes,
  public.announcements,
  public.assignments,
  public.submissions,
  public.meetings;
