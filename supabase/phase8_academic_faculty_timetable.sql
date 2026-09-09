-- ==============================================================================
-- PHASE 8: ACADEMIC STRUCTURE, FACULTY DIRECTORY & TIMETABLE DATABASE SETUP
-- ==============================================================================
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/onsjogeerbffmmiblzca
-- 2. Open "SQL Editor" -> "+ New query".
-- 3. Paste this script and click "Run" (Ctrl + Enter).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CLASSES TABLE ENHANCEMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_code TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    section TEXT NOT NULL,
    semester TEXT DEFAULT '7th Semester',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_classes_code ON public.classes(class_code);
CREATE INDEX IF NOT EXISTS idx_classes_dept_year ON public.classes(department, year, section);

-- ==============================================================================
-- 3. SUBJECTS TABLE ENHANCEMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code TEXT UNIQUE NOT NULL,
    subject_name TEXT NOT NULL,
    department TEXT NOT NULL,
    semester TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_subjects_code ON public.subjects(subject_code);
CREATE INDEX IF NOT EXISTS idx_subjects_dept ON public.subjects(department);

-- ==============================================================================
-- 4. FACULTY TABLE ENHANCEMENTS (DECOUPLE FROM PROFILES PK)
-- ==============================================================================
-- Allow faculty records to exist independently while optionally linking to auth profiles
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL DEFAULT 'Assistant Professor',
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'faculty_id_fkey' AND table_name = 'faculty'
    ) THEN
        ALTER TABLE public.faculty DROP CONSTRAINT faculty_id_fkey;
    END IF;
END $$;

ALTER TABLE public.faculty ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS assigned_subjects TEXT;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_faculty_fid ON public.faculty(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_dept ON public.faculty(department);
CREATE INDEX IF NOT EXISTS idx_faculty_name ON public.faculty(name);

-- ==============================================================================
-- 5. CLASS_SUBJECTS MAPPING TABLE ENHANCEMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add direct metadata columns for fast frontend query and display
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS class_section TEXT;
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS subject_code TEXT;
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS subject_name TEXT;
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 4;
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS faculty_assigned TEXT;
ALTER TABLE public.class_subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_class_subjects_section ON public.class_subjects(class_section);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subcode ON public.class_subjects(subject_code);

-- ==============================================================================
-- 6. TIMETABLES TABLE ENHANCEMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TIME,
    end_time TIME,
    room TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Make relational columns nullable if strict constraints existed
DO $$
BEGIN
    ALTER TABLE public.timetables ALTER COLUMN class_id DROP NOT NULL;
    ALTER TABLE public.timetables ALTER COLUMN subject_id DROP NOT NULL;
    ALTER TABLE public.timetables ALTER COLUMN start_time DROP NOT NULL;
    ALTER TABLE public.timetables ALTER COLUMN end_time DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.timetables ADD COLUMN IF NOT EXISTS class_code TEXT;
ALTER TABLE public.timetables ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE public.timetables ADD COLUMN IF NOT EXISTS subject_name TEXT;
ALTER TABLE public.timetables ADD COLUMN IF NOT EXISTS faculty_name TEXT;
ALTER TABLE public.timetables ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_timetables_class_code ON public.timetables(class_code, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetables_day ON public.timetables(day_of_week);

-- ==============================================================================
-- 7. TABLE PERMISSIONS
-- ==============================================================================
GRANT ALL ON public.classes TO authenticated, service_role, anon;
GRANT ALL ON public.subjects TO authenticated, service_role, anon;
GRANT ALL ON public.class_subjects TO authenticated, service_role, anon;
GRANT ALL ON public.faculty TO authenticated, service_role, anon;
GRANT ALL ON public.timetables TO authenticated, service_role, anon;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- 8.1 Classes Policies
DROP POLICY IF EXISTS "Public view classes" ON public.classes;
DROP POLICY IF EXISTS "Admins manage classes" ON public.classes;
CREATE POLICY "Public view classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Admins manage classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);

-- 8.2 Subjects Policies
DROP POLICY IF EXISTS "Public view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins manage subjects" ON public.subjects;
CREATE POLICY "Public view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

-- 8.3 Faculty Policies
DROP POLICY IF EXISTS "Public view faculty" ON public.faculty;
DROP POLICY IF EXISTS "Admins manage faculty" ON public.faculty;
CREATE POLICY "Public view faculty" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "Admins manage faculty" ON public.faculty FOR ALL USING (true) WITH CHECK (true);

-- 8.4 Class_Subjects Policies
DROP POLICY IF EXISTS "Public view class_subjects" ON public.class_subjects;
DROP POLICY IF EXISTS "Admins manage class_subjects" ON public.class_subjects;
CREATE POLICY "Public view class_subjects" ON public.class_subjects FOR SELECT USING (true);
CREATE POLICY "Admins manage class_subjects" ON public.class_subjects FOR ALL USING (true) WITH CHECK (true);

-- 8.5 Timetables Policies
DROP POLICY IF EXISTS "Public view timetables" ON public.timetables;
DROP POLICY IF EXISTS "Admins manage timetables" ON public.timetables;
CREATE POLICY "Public view timetables" ON public.timetables FOR SELECT USING (true);
CREATE POLICY "Admins manage timetables" ON public.timetables FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 9. REALTIME PUBLICATION
-- ==============================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_subjects;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.faculty;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.timetables;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 10. INITIAL SEED DATA
-- ==============================================================================

-- 10.1 Classes
INSERT INTO public.classes (class_code, department, year, section, semester)
VALUES
    ('CSE-A', 'CSE', '4th Year', 'A', '7th Semester'),
    ('CSE-B', 'CSE', '4th Year', 'B', '7th Semester'),
    ('ECE-A', 'ECE', '4th Year', 'A', '7th Semester'),
    ('MECH-A', 'MECH', '4th Year', 'A', '7th Semester'),
    ('CIVIL-A', 'CIVIL', '4th Year', 'A', '7th Semester')
ON CONFLICT (class_code) DO UPDATE
SET department = EXCLUDED.department,
    year = EXCLUDED.year,
    section = EXCLUDED.section,
    semester = EXCLUDED.semester;

-- 10.2 Subjects
INSERT INTO public.subjects (subject_code, subject_name, department, semester, credits)
VALUES
    ('CS401', 'Web Technologies', 'CSE', '7th Semester', 4),
    ('CS402', 'Computer Networks', 'CSE', '7th Semester', 4),
    ('CS403', 'Machine Learning', 'CSE', '7th Semester', 4),
    ('CS404', 'Cloud Computing', 'CSE', '7th Semester', 4),
    ('CS405', 'Software Engineering', 'CSE', '7th Semester', 4),
    ('CS406', 'Database Management Systems', 'CSE', '7th Semester', 4),
    ('CS407', 'Operating Systems', 'CSE', '7th Semester', 4),
    ('CS408', 'Cryptography', 'CSE', '7th Semester', 4),
    ('EC401', 'Digital Signal Processing', 'ECE', '7th Semester', 4),
    ('ME401', 'Thermodynamics & CAD', 'MECH', '7th Semester', 4)
ON CONFLICT (subject_code) DO UPDATE
SET subject_name = EXCLUDED.subject_name,
    department = EXCLUDED.department,
    semester = EXCLUDED.semester,
    credits = EXCLUDED.credits;

-- 10.3 Faculty Members
INSERT INTO public.faculty (faculty_id, name, department, designation, email, phone, assigned_subjects)
VALUES
    ('FAC001', 'Dr. K. Srinivas', 'CSE', 'Professor & HOD', 'srinivas.k@college.edu', '+91 98765 43201', 'Web Technologies, Cloud Computing'),
    ('FAC002', 'Prof. P. Lakshmi', 'CSE', 'Associate Professor', 'lakshmi.p@college.edu', '+91 98765 43202', 'Computer Networks, Software Engineering'),
    ('FAC003', 'Dr. M. Venkata Rao', 'CSE', 'Professor', 'venkatarao.m@college.edu', '+91 98765 43203', 'Machine Learning, Artificial Intelligence'),
    ('FAC004', 'Dr. Rajesh Sharma', 'CSE', 'Associate Professor', 'rajesh.sharma@college.edu', '+91 98765 43204', 'Database Management Systems, Cryptography'),
    ('FAC005', 'Prof. S. Raghunath', 'ECE', 'Professor & HOD', 'raghunath.s@college.edu', '+91 98765 43205', 'Digital Signal Processing, VLSI Design'),
    ('FAC006', 'Dr. B. Prasad', 'MECH', 'Professor & HOD', 'prasad.b@college.edu', '+91 98765 43206', 'Thermodynamics & CAD, Fluid Mechanics'),
    ('FAC007', 'Prof. N. Anuradha', 'CIVIL', 'Assistant Professor', 'anuradha.n@college.edu', '+91 98765 43207', 'Structural Engineering, Surveying')
ON CONFLICT (faculty_id) DO UPDATE
SET name = EXCLUDED.name,
    department = EXCLUDED.department,
    designation = EXCLUDED.designation,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    assigned_subjects = EXCLUDED.assigned_subjects;

-- 10.4 Class-Subjects Mappings
INSERT INTO public.class_subjects (class_section, department, year, semester, subject_code, subject_name, credits, faculty_assigned)
VALUES
    ('CSE-A', 'CSE', '4th Year', '7th Semester', 'CS401', 'Web Technologies', 4, 'Dr. K. Srinivas'),
    ('CSE-A', 'CSE', '4th Year', '7th Semester', 'CS402', 'Computer Networks', 4, 'Prof. P. Lakshmi'),
    ('CSE-A', 'CSE', '4th Year', '7th Semester', 'CS403', 'Machine Learning', 4, 'Dr. M. Venkata Rao'),
    ('CSE-A', 'CSE', '4th Year', '7th Semester', 'CS404', 'Cloud Computing', 4, 'Dr. K. Srinivas'),
    ('CSE-A', 'CSE', '4th Year', '7th Semester', 'CS406', 'Database Management Systems', 4, 'Dr. Rajesh Sharma'),
    ('CSE-B', 'CSE', '4th Year', '7th Semester', 'CS405', 'Software Engineering', 4, 'Prof. P. Lakshmi'),
    ('ECE-A', 'ECE', '4th Year', '7th Semester', 'EC401', 'Digital Signal Processing', 4, 'Prof. S. Raghunath'),
    ('MECH-A', 'MECH', '4th Year', '7th Semester', 'ME401', 'Thermodynamics & CAD', 4, 'Dr. B. Prasad')
ON CONFLICT DO NOTHING;

-- 10.5 Timetable Default Slots for CSE-A
INSERT INTO public.timetables (class_code, day_of_week, period, subject_name, faculty_name, room)
VALUES
    ('CSE-A', 'Monday', '09:00 - 10:00 AM', 'Web Technologies', 'Dr. K. Srinivas', 'Room 401'),
    ('CSE-A', 'Monday', '10:00 - 11:00 AM', 'Computer Networks', 'Prof. P. Lakshmi', 'Room 401'),
    ('CSE-A', 'Monday', '11:15 - 12:15 PM', 'Machine Learning', 'Dr. M. Venkata Rao', 'Room 401'),
    ('CSE-A', 'Tuesday', '09:00 - 10:00 AM', 'Cloud Computing', 'Dr. K. Srinivas', 'Lab 2'),
    ('CSE-A', 'Tuesday', '10:00 - 11:00 AM', 'Software Engineering', 'Prof. P. Lakshmi', 'Room 401'),
    ('CSE-A', 'Wednesday', '09:00 - 10:00 AM', 'Web Technologies', 'Dr. K. Srinivas', 'Room 401'),
    ('CSE-A', 'Wednesday', '10:00 - 11:00 AM', 'Database Management Systems', 'Dr. Rajesh Sharma', 'Lab 1'),
    ('CSE-A', 'Thursday', '09:00 - 10:00 AM', 'Machine Learning', 'Dr. M. Venkata Rao', 'Room 401'),
    ('CSE-A', 'Friday', '09:00 - 10:00 AM', 'Computer Networks', 'Prof. P. Lakshmi', 'Room 401')
ON CONFLICT DO NOTHING;
