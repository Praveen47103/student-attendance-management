-- ==============================================================================
-- STUDENT ATTENDANCE MANAGEMENT SYSTEM — SUPABASE SEED DATA
-- ==============================================================================
-- Run this script in your Supabase Dashboard: SQL Editor -> New query -> Run.
-- Note: Make sure supabase/schema.sql has been executed first.
-- ==============================================================================

-- 1. SEED DEFAULT CLASSES
INSERT INTO public.classes (class_code, department, year, section, semester)
VALUES
    ('CSE-A', 'CSE', '4th Year', 'A', '7th Semester'),
    ('CSE-B', 'CSE', '4th Year', 'B', '7th Semester'),
    ('ECE-A', 'ECE', '4th Year', 'A', '7th Semester'),
    ('MECH-A', 'MECH', '4th Year', 'A', '7th Semester'),
    ('CIVIL-A', 'CIVIL', '4th Year', 'A', '7th Semester')
ON CONFLICT (class_code) DO NOTHING;

-- 2. SEED DEFAULT SUBJECTS
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

-- 3. LINK CLASSES AND SUBJECTS
INSERT INTO public.class_subjects (class_id, subject_id)
SELECT c.id, s.id
FROM public.classes c
CROSS JOIN public.subjects s
WHERE c.class_code = 'CSE-A' AND s.department = 'CSE'
ON CONFLICT (class_id, subject_id) DO NOTHING;

-- 4. SEED TIMETABLE FOR CSE-A
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
            (v_class_id, v_sub_cn, 'Friday', '09:00', '10:00', 'Room 401');
    END IF;
END $$;

-- 5. HOW TO CREATE YOUR INITIAL ADMIN USER:
-- Option A: Via Supabase Dashboard:
-- 1. Go to Authentication -> Users -> Add User.
-- 2. Email: admin@college.edu (or your desired email).
-- 3. Password: <Choose a strong password>.
-- 4. In SQL Editor, run:
--    UPDATE public.profiles SET role = 'admin', full_name = 'System Administrator' WHERE email = 'admin@college.edu';
--
-- Option B: SQL Insert (only if creating directly with pgcrypto):
-- DO $$
-- DECLARE
--     new_user_id UUID := gen_random_uuid();
-- BEGIN
--     INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
--     VALUES (
--         new_user_id,
--         'admin@college.edu',
--         crypt('Admin@Secure2026', gen_salt('bf')),
--         now(),
--         '{"role": "admin", "full_name": "System Administrator"}'::jsonb
--     );
-- END $$;
