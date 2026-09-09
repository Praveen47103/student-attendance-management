-- ==============================================================================
-- PHASE 9: ADMIN ANNOUNCEMENTS & TARGETED NOTIFICATIONS SETUP
-- ==============================================================================
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/onsjogeerbffmmiblzca
-- 2. Open "SQL Editor" -> "+ New query".
-- 3. Paste this script and click "Run" (Ctrl + Enter).
-- ==============================================================================

-- 1. ANNOUNCEMENTS TABLE ENHANCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('announcement', 'attendance', 'warning', 'general')),
    target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'class', 'student')),
    target_class TEXT,
    target_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    target_role TEXT DEFAULT 'student' CHECK (target_role IN ('all', 'student', 'teacher', 'admin')),
    sender_name TEXT DEFAULT 'Administrator',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure created_by can be NULL for system/demo admins
DO $$
BEGIN
    ALTER TABLE public.announcements ALTER COLUMN created_by DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'announcement';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_audience TEXT NOT NULL DEFAULT 'all';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_class TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'student';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT 'Administrator';

CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_target_audience ON public.announcements(target_audience);
CREATE INDEX IF NOT EXISTS idx_announcements_target_class ON public.announcements(target_class);

-- 2. NOTIFICATIONS TABLE ENHANCEMENTS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('attendance', 'leave', 'warning', 'announcement', 'general')),
    target_role TEXT DEFAULT 'all' CHECK (target_role IN ('all', 'admin', 'teacher', 'student')),
    target_class TEXT,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    sender_name TEXT DEFAULT 'Administrator',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_class TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT 'Administrator';

CREATE INDEX IF NOT EXISTS idx_notifications_target_class ON public.notifications(target_class);
CREATE INDEX IF NOT EXISTS idx_notifications_announcement ON public.notifications(announcement_id);
CREATE INDEX IF NOT EXISTS idx_notifications_student_read ON public.notifications(student_id, is_read);

-- 3. PERMISSIONS & PRIVILEGES
GRANT ALL ON public.announcements TO authenticated, service_role, anon;
GRANT ALL ON public.notifications TO authenticated, service_role, anon;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Announcements Policies
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

-- Notifications Policies
DROP POLICY IF EXISTS "Anyone can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can update notifications is_read" ON public.notifications;
DROP POLICY IF EXISTS "Admins insert notifications" ON public.notifications;
CREATE POLICY "Anyone can view notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can update notifications is_read" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Admins insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 5. REALTIME REPLICATION
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. INITIAL SEED ANNOUNCEMENT
INSERT INTO public.announcements (title, content, type, target_audience, target_role, sender_name)
VALUES
    ('Welcome to the New Academic Semester! 🎓', 'Classes commence according to the weekly timetable. Please ensure your attendance remains above 75% throughout the semester.', 'announcement', 'all', 'student', 'Administrator')
ON CONFLICT DO NOTHING;
