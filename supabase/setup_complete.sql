-- ==============================================================================
-- STUDENT ATTENDANCE MANAGEMENT SYSTEM — ALL-IN-ONE DATABASE SETUP
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/onsjogeerbffmmiblzca
-- 2. Click "SQL Editor" on the left menu.
-- 3. Click "+ New query", paste this entire script, and click "Run" (Ctrl + Enter).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- 2.1 PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    roll_number TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL DEFAULT 'CSE',
    year TEXT NOT NULL DEFAULT '4th Year',
    semester TEXT NOT NULL DEFAULT '7th Semester',
    section TEXT NOT NULL DEFAULT 'A',
    date_of_birth DATE,
    gender TEXT,
    admission_date DATE,
    batch TEXT DEFAULT '2021-2025',
    cgpa NUMERIC(4,2) DEFAULT 0.0,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 FACULTY TABLE
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    faculty_id TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL DEFAULT 'Assistant Professor',
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_code TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    section TEXT NOT NULL,
    semester TEXT DEFAULT '7th Semester',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code TEXT UNIQUE NOT NULL,
    subject_name TEXT NOT NULL,
    department TEXT NOT NULL,
    semester TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 CLASS_SUBJECTS MAPPING
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, subject_id)
);

-- 2.7 ATTENDANCE SESSIONS
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    marked_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, subject_id, date)
);

-- 2.8 ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(session_id, student_id)
);

-- 2.9 LEAVE REQUESTS
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Personal', 'Medical', 'Casual', 'Emergency')),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    days INTEGER NOT NULL CHECK (days > 0),
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    reviewed_by UUID REFERENCES public.profiles(id),
    review_remarks TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.10 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('attendance', 'leave', 'warning', 'announcement', 'general')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.11 ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT DEFAULT 'all' CHECK (target_role IN ('all', 'student', 'teacher')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.12 TIMETABLES
CREATE TABLE IF NOT EXISTS public.timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_dept_year ON public.students(department, year, section);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_sub ON public.attendance_sessions(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_student ON public.leave_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_timetables_class_day ON public.timetables(class_id, day_of_week);

-- ==============================================================================
-- 4. FUNCTIONS & TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_attendance_sessions_updated_at ON public.attendance_sessions;
CREATE TRIGGER set_attendance_sessions_updated_at
    BEFORE UPDATE ON public.attendance_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER set_leave_requests_updated_at
    BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, user_name, user_role)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. RLS HELPER FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'teacher'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- 6.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "Users can update own profile non-role details" ON public.profiles;
CREATE POLICY "Users can update own profile non-role details"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins full management on profiles" ON public.profiles;
CREATE POLICY "Admins full management on profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- 6.2 STUDENTS POLICIES
DROP POLICY IF EXISTS "Students can view own student record" ON public.students;
CREATE POLICY "Students can view own student record"
    ON public.students FOR SELECT
    USING (id = auth.uid() OR public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "Admins manage students" ON public.students;
CREATE POLICY "Admins manage students"
    ON public.students FOR ALL
    USING (public.is_admin());

-- 6.3 FACULTY POLICIES
DROP POLICY IF EXISTS "Everyone can view faculty directory" ON public.faculty;
CREATE POLICY "Everyone can view faculty directory"
    ON public.faculty FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins manage faculty" ON public.faculty;
CREATE POLICY "Admins manage faculty"
    ON public.faculty FOR ALL
    USING (public.is_admin());

-- 6.4 CLASSES & SUBJECTS POLICIES
DROP POLICY IF EXISTS "Authenticated users view classes" ON public.classes;
CREATE POLICY "Authenticated users view classes"
    ON public.classes FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage classes" ON public.classes;
CREATE POLICY "Admins manage classes"
    ON public.classes FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users view subjects" ON public.subjects;
CREATE POLICY "Authenticated users view subjects"
    ON public.subjects FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage subjects" ON public.subjects;
CREATE POLICY "Admins manage subjects"
    ON public.subjects FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users view class_subjects" ON public.class_subjects;
CREATE POLICY "Authenticated users view class_subjects"
    ON public.class_subjects FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage class_subjects" ON public.class_subjects;
CREATE POLICY "Admins manage class_subjects"
    ON public.class_subjects FOR ALL
    USING (public.is_admin());

-- 6.5 ATTENDANCE POLICIES
DROP POLICY IF EXISTS "Students view their own attendance records" ON public.attendance_records;
CREATE POLICY "Students view their own attendance records"
    ON public.attendance_records FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "Teachers and admins manage attendance records" ON public.attendance_records;
CREATE POLICY "Teachers and admins manage attendance records"
    ON public.attendance_records FOR ALL
    USING (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "Students view attendance sessions" ON public.attendance_sessions;
CREATE POLICY "Students view attendance sessions"
    ON public.attendance_sessions FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers and admins manage attendance sessions" ON public.attendance_sessions;
CREATE POLICY "Teachers and admins manage attendance sessions"
    ON public.attendance_sessions FOR ALL
    USING (public.is_admin() OR public.is_teacher());

-- 6.6 LEAVE REQUESTS POLICIES
DROP POLICY IF EXISTS "Students view own leave requests" ON public.leave_requests;
CREATE POLICY "Students view own leave requests"
    ON public.leave_requests FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "Students insert own leave requests" ON public.leave_requests;
CREATE POLICY "Students insert own leave requests"
    ON public.leave_requests FOR INSERT
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students delete own pending leave requests" ON public.leave_requests;
CREATE POLICY "Students delete own pending leave requests"
    ON public.leave_requests FOR DELETE
    USING (student_id = auth.uid() AND status = 'Pending');

DROP POLICY IF EXISTS "Admins and teachers review leave requests" ON public.leave_requests;
CREATE POLICY "Admins and teachers review leave requests"
    ON public.leave_requests FOR UPDATE
    USING (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "Admins delete leave requests" ON public.leave_requests;
CREATE POLICY "Admins delete leave requests"
    ON public.leave_requests FOR DELETE
    USING (public.is_admin());

-- 6.7 NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notification is_read" ON public.notifications;
CREATE POLICY "Users update own notification is_read"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and teachers insert notifications" ON public.notifications;
CREATE POLICY "Admins and teachers insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (public.is_admin() OR public.is_teacher());

-- 6.8 ANNOUNCEMENTS POLICIES
DROP POLICY IF EXISTS "Everyone views announcements" ON public.announcements;
CREATE POLICY "Everyone views announcements"
    ON public.announcements FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins create announcements" ON public.announcements;
CREATE POLICY "Admins create announcements"
    ON public.announcements FOR ALL
    USING (public.is_admin() OR public.is_teacher());

-- 6.9 TIMETABLES POLICIES
DROP POLICY IF EXISTS "Everyone views timetables" ON public.timetables;
CREATE POLICY "Everyone views timetables"
    ON public.timetables FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins manage timetables" ON public.timetables;
CREATE POLICY "Admins manage timetables"
    ON public.timetables FOR ALL
    USING (public.is_admin());

-- ==============================================================================
-- 7. REALTIME REPLICATION
-- ==============================================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 8. INITIAL SEED DATA
-- ==============================================================================

-- Classes
INSERT INTO public.classes (class_code, department, year, section, semester)
VALUES
    ('CSE-A', 'CSE', '4th Year', 'A', '7th Semester'),
    ('CSE-B', 'CSE', '4th Year', 'B', '7th Semester'),
    ('ECE-A', 'ECE', '4th Year', 'A', '7th Semester'),
    ('MECH-A', 'MECH', '4th Year', 'A', '7th Semester'),
    ('CIVIL-A', 'CIVIL', '4th Year', 'A', '7th Semester')
ON CONFLICT (class_code) DO NOTHING;

-- Subjects
INSERT INTO public.subjects (subject_code, subject_name, department, semester, credits)
VALUES
    ('CS401', 'Web Technologies', 'CSE', '7th Semester', 4),
    ('CS402', 'Computer Networks', 'CSE', '7th Semester', 4),
    ('CS403', 'Machine Learning', 'CSE', '7th Semester', 4),
    ('CS404', 'Cloud Computing', 'CSE', '7th Semester', 4),
    ('CS405', 'Software Engineering', 'CSE', '7th Semester', 4),
    ('CS406', 'Database Management', 'CSE', '7th Semester', 4),
    ('CS407', 'Operating Systems', 'CSE', '7th Semester', 4),
    ('CS408', 'Cryptography', 'CSE', '7th Semester', 4)
ON CONFLICT (subject_code) DO NOTHING;

-- Map subjects to CSE-A
INSERT INTO public.class_subjects (class_id, subject_id)
SELECT c.id, s.id
FROM public.classes c
CROSS JOIN public.subjects s
WHERE c.class_code = 'CSE-A' AND s.department = 'CSE'
ON CONFLICT (class_id, subject_id) DO NOTHING;

-- Timetable
DO $$
DECLARE
    v_class_id UUID;
    v_sub_web UUID;
    v_sub_cn UUID;
    v_sub_ml UUID;
    v_sub_cloud UUID;
    v_sub_se UUID;
    v_sub_dbms UUID;
BEGIN
    SELECT id INTO v_class_id FROM public.classes WHERE class_code = 'CSE-A' LIMIT 1;
    SELECT id INTO v_sub_web FROM public.subjects WHERE subject_code = 'CS401' LIMIT 1;
    SELECT id INTO v_sub_cn FROM public.subjects WHERE subject_code = 'CS402' LIMIT 1;
    SELECT id INTO v_sub_ml FROM public.subjects WHERE subject_code = 'CS403' LIMIT 1;
    SELECT id INTO v_sub_cloud FROM public.subjects WHERE subject_code = 'CS404' LIMIT 1;
    SELECT id INTO v_sub_se FROM public.subjects WHERE subject_code = 'CS405' LIMIT 1;
    SELECT id INTO v_sub_dbms FROM public.subjects WHERE subject_code = 'CS406' LIMIT 1;

    IF v_class_id IS NOT NULL AND v_sub_web IS NOT NULL THEN
        INSERT INTO public.timetables (class_id, subject_id, day_of_week, start_time, end_time, room)
        VALUES
            (v_class_id, v_sub_web, 'Monday', '09:00', '10:00', 'Room 401'),
            (v_class_id, v_sub_cn, 'Monday', '10:00', '11:00', 'Room 401'),
            (v_class_id, v_sub_ml, 'Monday', '11:15', '12:15', 'Room 401'),
            (v_class_id, v_sub_cloud, 'Tuesday', '09:00', '10:00', 'Lab 2'),
            (v_class_id, v_sub_se, 'Tuesday', '10:00', '11:00', 'Room 401'),
            (v_class_id, v_sub_web, 'Wednesday', '09:00', '10:00', 'Room 401'),
            (v_class_id, v_sub_dbms, 'Wednesday', '10:00', '11:00', 'Lab 1'),
            (v_class_id, v_sub_ml, 'Thursday', '09:00', '10:00', 'Room 401'),
            (v_class_id, v_sub_cn, 'Friday', '09:00', '10:00', 'Room 401')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
