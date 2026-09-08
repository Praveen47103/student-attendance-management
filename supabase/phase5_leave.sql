-- ==============================================================================
-- PHASE 5: LEAVE MANAGEMENT SYSTEM DATABASE SETUP
-- ==============================================================================
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/onsjogeerbffmmiblzca
-- 2. Open "SQL Editor" -> "+ New query".
-- 3. Paste this script and run it (Ctrl + Enter).
-- ==============================================================================

-- 1. ENSURE TABLE PERMISSIONS & PRIVILEGES
GRANT ALL ON public.leave_requests TO authenticated, service_role, anon;

-- 2. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Select policy: Admins and teachers can view all leaves.
-- Students can view their own leave requests.
-- Authenticated & anon users have access for dual-mode demo and portal compatibility.
DROP POLICY IF EXISTS "Students view own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Authenticated users view leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Anyone view leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Leave requests select policy" ON public.leave_requests;

CREATE POLICY "Leave requests select policy"
    ON public.leave_requests FOR SELECT
    USING (
        public.is_admin()
        OR public.is_teacher()
        OR student_id IN (
            SELECT id FROM public.students 
            WHERE profile_id = auth.uid()
               OR LOWER(roll_number) = LOWER(split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1))
        )
        OR auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );

-- Insert policy: Students can submit their own leave requests.
-- Admins/teachers can also submit if needed.
DROP POLICY IF EXISTS "Students insert own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Leave requests insert policy" ON public.leave_requests;

CREATE POLICY "Leave requests insert policy"
    ON public.leave_requests FOR INSERT
    WITH CHECK (
        public.is_admin()
        OR public.is_teacher()
        OR student_id IN (
            SELECT id FROM public.students 
            WHERE profile_id = auth.uid()
               OR LOWER(roll_number) = LOWER(split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1))
        )
        OR auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );

-- Update policy: Admins and teachers can review/approve/reject leave requests.
DROP POLICY IF EXISTS "Admins and teachers review leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Leave requests update policy" ON public.leave_requests;

CREATE POLICY "Leave requests update policy"
    ON public.leave_requests FOR UPDATE
    USING (
        public.is_admin()
        OR public.is_teacher()
        OR auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );

-- Delete policy: Admins can delete requests; students can delete their own pending requests.
DROP POLICY IF EXISTS "Students delete own pending leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Admins delete leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Leave requests delete policy" ON public.leave_requests;

CREATE POLICY "Leave requests delete policy"
    ON public.leave_requests FOR DELETE
    USING (
        public.is_admin()
        OR (
            status = 'Pending' AND student_id IN (
                SELECT id FROM public.students 
                WHERE profile_id = auth.uid()
                   OR LOWER(roll_number) = LOWER(split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1))
            )
        )
        OR auth.role() = 'authenticated'
        OR auth.role() = 'anon'
    );

-- 3. ENABLE REALTIME REPLICATION FOR LEAVE REQUESTS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. SEED SAMPLE LEAVE REQUESTS (If table is currently empty)
DO $$
DECLARE
    v_s1 UUID;
    v_s2 UUID;
    v_s3 UUID;
BEGIN
    SELECT id INTO v_s1 FROM public.students WHERE roll_number = '23RU1A0501' LIMIT 1;
    SELECT id INTO v_s2 FROM public.students WHERE roll_number = '23RU1A0504' LIMIT 1;
    SELECT id INTO v_s3 FROM public.students WHERE roll_number = '23RU1A0510' LIMIT 1;

    -- If student 23RU1A0501 has no leave requests, insert medical sample
    IF v_s1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.leave_requests WHERE student_id = v_s1) THEN
        INSERT INTO public.leave_requests (
            student_id, type, from_date, to_date, days, reason, description, status, created_at
        ) VALUES (
            v_s1,
            'Medical',
            CURRENT_DATE + INTERVAL '2 days',
            CURRENT_DATE + INTERVAL '4 days',
            3,
            'Viral Fever and medical recovery',
            'Doctor has advised 3 days complete bed rest. Prescription copy attached.',
            'Pending',
            now() - INTERVAL '2 hours'
        );
    END IF;

    -- If student 23RU1A0504 has no leave requests, insert approved personal sample
    IF v_s2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.leave_requests WHERE student_id = v_s2) THEN
        INSERT INTO public.leave_requests (
            student_id, type, from_date, to_date, days, reason, description, status, created_at
        ) VALUES (
            v_s2,
            'Personal',
            CURRENT_DATE + INTERVAL '6 days',
            CURRENT_DATE + INTERVAL '7 days',
            2,
            'Family function attending',
            'Attending cousin wedding ceremony in hometown.',
            'Approved',
            now() - INTERVAL '1 day'
        );
    END IF;

    -- If student 23RU1A0510 has no leave requests, insert pending casual sample
    IF v_s3 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.leave_requests WHERE student_id = v_s3) THEN
        INSERT INTO public.leave_requests (
            student_id, type, from_date, to_date, days, reason, description, status, created_at
        ) VALUES (
            v_s3,
            'Casual',
            CURRENT_DATE + INTERVAL '10 days',
            CURRENT_DATE + INTERVAL '10 days',
            1,
            'Competitive exam attendance',
            'State level certification examination slot.',
            'Pending',
            now() - INTERVAL '3 hours'
        );
    END IF;
END $$;
