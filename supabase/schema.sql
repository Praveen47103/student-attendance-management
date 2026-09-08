-- ==============================================================================
-- STUDENT ATTENDANCE MANAGEMENT SYSTEM — SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================
-- Run this script in your Supabase Dashboard: SQL Editor -> New query -> Run.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLES DEFINITIONS
-- ==============================================================================

-- 2.1 PROFILES TABLE (Linked directly to Supabase auth.users)
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

-- 2.3 FACULTY / TEACHERS TABLE
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
    class_code TEXT UNIQUE NOT NULL, -- e.g. 'CSE-A', 'CSE-B'
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    section TEXT NOT NULL,
    semester TEXT DEFAULT '7th Semester',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code TEXT UNIQUE NOT NULL, -- e.g. 'CS401'
    subject_name TEXT NOT NULL,
    department TEXT NOT NULL,
    semester TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 CLASS_SUBJECTS MAPPING (with assigned faculty)
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, subject_id)
);

-- 2.7 ATTENDANCE SESSIONS TABLE (Master record for each class attendance session)
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

-- 2.8 ATTENDANCE RECORDS TABLE (Individual student attendance marks per session)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(session_id, student_id)
);

-- 2.9 LEAVE REQUESTS TABLE
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

-- 2.10 NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('attendance', 'leave', 'warning', 'announcement', 'general')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.11 ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role TEXT DEFAULT 'all' CHECK (target_role IN ('all', 'student', 'teacher')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.12 TIMETABLES TABLE
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
-- 3. INDEXES FOR HIGH QUERY PERFORMANCE
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
-- 4. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 4.1 Update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
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

-- 4.2 Automated Profile Creation from auth.users (Supabase Auth Hook)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS (PREVENTS RECURSION)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'teacher'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
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
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.is_admin() OR public.is_teacher());

CREATE POLICY "Users can update own profile non-role details"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins full management on profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- 6.2 STUDENTS POLICIES
CREATE POLICY "Students can view own student record"
    ON public.students FOR SELECT
    USING (id = auth.uid() OR public.is_admin() OR public.is_teacher());

CREATE POLICY "Admins manage students"
    ON public.students FOR ALL
    USING (public.is_admin());

-- 6.3 FACULTY POLICIES
CREATE POLICY "Everyone can view faculty directory"
    ON public.faculty FOR SELECT
    USING (true);

CREATE POLICY "Admins manage faculty"
    ON public.faculty FOR ALL
    USING (public.is_admin());

-- 6.4 CLASSES & SUBJECTS POLICIES
CREATE POLICY "Authenticated users view classes"
    ON public.classes FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage classes"
    ON public.classes FOR ALL
    USING (public.is_admin());

CREATE POLICY "Authenticated users view subjects"
    ON public.subjects FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage subjects"
    ON public.subjects FOR ALL
    USING (public.is_admin());

CREATE POLICY "Authenticated users view class_subjects"
    ON public.class_subjects FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage class_subjects"
    ON public.class_subjects FOR ALL
    USING (public.is_admin());

-- 6.5 ATTENDANCE POLICIES
CREATE POLICY "Students view their own attendance records"
    ON public.attendance_records FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher());

CREATE POLICY "Teachers and admins manage attendance records"
    ON public.attendance_records FOR ALL
    USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Students view attendance sessions"
    ON public.attendance_sessions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins manage attendance sessions"
    ON public.attendance_sessions FOR ALL
    USING (public.is_admin() OR public.is_teacher());

-- 6.6 LEAVE REQUESTS POLICIES
CREATE POLICY "Students view own leave requests"
    ON public.leave_requests FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin() OR public.is_teacher());

CREATE POLICY "Students insert own leave requests"
    ON public.leave_requests FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students delete own pending leave requests"
    ON public.leave_requests FOR DELETE
    USING (student_id = auth.uid() AND status = 'Pending');

CREATE POLICY "Admins and teachers review leave requests"
    ON public.leave_requests FOR UPDATE
    USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "Admins delete leave requests"
    ON public.leave_requests FOR DELETE
    USING (public.is_admin());

-- 6.7 NOTIFICATIONS POLICIES
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users update own notification is_read"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Admins and teachers insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (public.is_admin() OR public.is_teacher());

-- 6.8 ANNOUNCEMENTS POLICIES
CREATE POLICY "Everyone views announcements"
    ON public.announcements FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins create announcements"
    ON public.announcements FOR ALL
    USING (public.is_admin() OR public.is_teacher());

-- 6.9 TIMETABLES POLICIES
CREATE POLICY "Everyone views timetables"
    ON public.timetables FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage timetables"
    ON public.timetables FOR ALL
    USING (public.is_admin());

-- ==============================================================================
-- 7. ENABLE SUPABASE REALTIME REPLICATION
-- ==============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
