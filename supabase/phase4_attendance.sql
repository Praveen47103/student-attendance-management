-- ==============================================================================
-- PHASE 4: ONLINE ATTENDANCE & REALTIME DATABASE SETUP
-- ==============================================================================
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/onsjogeerbffmmiblzca
-- 2. Open "SQL Editor" -> "+ New query".
-- 3. Paste this script and run it (Ctrl + Enter).
-- ==============================================================================

-- 1. TABLE PRIVILEGES & PERMISSIONS
GRANT ALL ON public.attendance_sessions TO authenticated, service_role;
GRANT ALL ON public.attendance_records TO authenticated, service_role;
GRANT SELECT ON public.attendance_sessions TO anon;
GRANT SELECT ON public.attendance_records TO anon;

GRANT ALL ON public.classes TO authenticated, service_role;
GRANT ALL ON public.subjects TO authenticated, service_role;
GRANT ALL ON public.class_subjects TO authenticated, service_role;
GRANT SELECT ON public.classes TO anon;
GRANT SELECT ON public.subjects TO anon;
GRANT SELECT ON public.class_subjects TO anon;

-- 2. RLS POLICIES FOR ATTENDANCE
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Attendance Sessions Policies
DROP POLICY IF EXISTS "Authenticated users view attendance sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Students view attendance sessions" ON public.attendance_sessions;
CREATE POLICY "Authenticated users view attendance sessions"
    ON public.attendance_sessions FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers and admins manage attendance sessions" ON public.attendance_sessions;
CREATE POLICY "Teachers and admins manage attendance sessions"
    ON public.attendance_sessions FOR ALL
    USING (public.is_admin() OR public.is_teacher());

-- Attendance Records Policies
DROP POLICY IF EXISTS "Authenticated users view attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Students view their own attendance records" ON public.attendance_records;
CREATE POLICY "Authenticated users view attendance records"
    ON public.attendance_records FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers and admins manage attendance records" ON public.attendance_records;
CREATE POLICY "Teachers and admins manage attendance records"
    ON public.attendance_records FOR ALL
    USING (public.is_admin() OR public.is_teacher());

-- 3. ATOMIC ATTENDANCE BATCH SAVER (RPC)
-- Saves session and all student records in a single transactional call
CREATE OR REPLACE FUNCTION public.save_attendance_batch(
    p_class_code TEXT,
    p_subject_code TEXT,
    p_date DATE,
    p_records JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_class_id UUID;
    v_subject_id UUID;
    v_session_id UUID;
    v_marked_by UUID;
    v_roll TEXT;
    v_status TEXT;
    v_student_id UUID;
    v_inserted_count INT := 0;
BEGIN
    -- Determine marker profile (or fallback to first admin)
    v_marked_by := auth.uid();
    IF v_marked_by IS NULL THEN
        SELECT id INTO v_marked_by FROM public.profiles WHERE role = 'admin' LIMIT 1;
    END IF;

    -- Look up class_id (or create CSE-A default if not found)
    SELECT id INTO v_class_id FROM public.classes WHERE class_code = p_class_code LIMIT 1;
    IF v_class_id IS NULL THEN
        INSERT INTO public.classes (class_code, department, year, section)
        VALUES (p_class_code, 'CSE', '4th Year', 'A')
        RETURNING id INTO v_class_id;
    END IF;

    -- Look up subject_id (or create CS401 default if not found)
    SELECT id INTO v_subject_id FROM public.subjects WHERE subject_code = p_subject_code LIMIT 1;
    IF v_subject_id IS NULL THEN
        INSERT INTO public.subjects (subject_code, subject_name, department, semester, credits)
        VALUES (p_subject_code, 'General Subject', 'CSE', '7th Semester', 4)
        RETURNING id INTO v_subject_id;
    END IF;

    -- Insert or update attendance session
    INSERT INTO public.attendance_sessions (class_id, subject_id, date, marked_by)
    VALUES (v_class_id, v_subject_id, p_date, v_marked_by)
    ON CONFLICT (class_id, subject_id, date) DO UPDATE
    SET updated_at = now()
    RETURNING id INTO v_session_id;

    -- Loop through the JSONB key-values (roll_number => status)
    FOR v_roll, v_status IN SELECT * FROM jsonb_each_text(p_records)
    LOOP
        -- Find student id
        SELECT id INTO v_student_id FROM public.students WHERE LOWER(roll_number) = LOWER(v_roll) LIMIT 1;

        IF v_student_id IS NOT NULL THEN
            INSERT INTO public.attendance_records (session_id, student_id, status)
            VALUES (v_session_id, v_student_id, v_status)
            ON CONFLICT (session_id, student_id) DO UPDATE
            SET status = EXCLUDED.status;

            v_inserted_count := v_inserted_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_session_id,
        'records_processed', v_inserted_count,
        'date', p_date,
        'class_code', p_class_code,
        'subject_code', p_subject_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. REALTIME PUBLICATION SETUP
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
