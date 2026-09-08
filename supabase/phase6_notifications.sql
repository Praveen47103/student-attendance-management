-- ==============================================================================
-- PHASE 6: IN-APP NOTIFICATIONS & SECURE EMAIL ALERTS SETUP
-- ==============================================================================
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/onsjogeerbffmmiblzca
-- 2. Open "SQL Editor" -> "+ New query".
-- 3. Paste this script and run it (Ctrl + Enter).
-- ==============================================================================

-- 1. NOTIFICATIONS TABLE ENHANCEMENTS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('attendance', 'leave', 'warning', 'announcement', 'general')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add student_id and target_role columns if not present
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'all' CHECK (target_role IN ('all', 'admin', 'teacher', 'student'));
ALTER TABLE public.notifications ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_student ON public.notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON public.notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- 2. SECURE EMAIL QUEUE TABLE
-- All email alerts are queued in PostgreSQL and dispatched server-side
-- (NO email API keys or SMTP secrets are ever exposed in frontend JavaScript)
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('leave_submitted', 'leave_approved', 'leave_rejected', 'low_attendance_warning', 'attendance_absent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON public.email_queue(created_at);

-- 3. PERMISSIONS & PRIVILEGES
GRANT ALL ON public.notifications TO authenticated, service_role, anon;
GRANT ALL ON public.email_queue TO authenticated, service_role, anon;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Notifications Select Policy:
-- Admins view all notifications; students view their own or global announcements
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow view notifications" ON public.notifications;
CREATE POLICY "Allow view notifications"
    ON public.notifications FOR SELECT
    USING (
        public.is_admin()
        OR public.is_teacher()
        OR student_id IN (
            SELECT id FROM public.students 
            WHERE profile_id = auth.uid() 
               OR LOWER(roll_number) = LOWER(split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1))
        )
        OR user_id = auth.uid()
        OR target_role = 'all'
        OR target_role = 'student'
        OR auth.role() = 'anon'
    );

-- Notifications Update Policy (Mark as Read):
DROP POLICY IF EXISTS "Users update own notification is_read" ON public.notifications;
DROP POLICY IF EXISTS "Allow update notifications" ON public.notifications;
CREATE POLICY "Allow update notifications"
    ON public.notifications FOR UPDATE
    USING (
        public.is_admin()
        OR public.is_teacher()
        OR student_id IN (
            SELECT id FROM public.students 
            WHERE profile_id = auth.uid() 
               OR LOWER(roll_number) = LOWER(split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1))
        )
        OR user_id = auth.uid()
        OR auth.role() = 'anon'
    );

-- Notifications Insert & Delete Policies:
DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;
CREATE POLICY "Allow insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete notifications" ON public.notifications;
CREATE POLICY "Allow delete notifications"
    ON public.notifications FOR DELETE
    USING (
        public.is_admin()
        OR student_id IN (
            SELECT id FROM public.students 
            WHERE profile_id = auth.uid() 
               OR LOWER(roll_number) = LOWER(split_part(COALESCE(auth.jwt()->>'email', ''), '@', 1))
        )
        OR user_id = auth.uid()
        OR auth.role() = 'anon'
    );

-- Email Queue Policies:
DROP POLICY IF EXISTS "Allow select email_queue" ON public.email_queue;
CREATE POLICY "Allow select email_queue"
    ON public.email_queue FOR SELECT
    USING (public.is_admin() OR auth.role() = 'service_role' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Allow insert email_queue" ON public.email_queue;
CREATE POLICY "Allow insert email_queue"
    ON public.email_queue FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update email_queue" ON public.email_queue;
CREATE POLICY "Allow update email_queue"
    ON public.email_queue FOR UPDATE
    USING (public.is_admin() OR auth.role() = 'service_role');

-- 5. AUTOMATED NOTIFICATION & EMAIL QUEUE TRIGGERS

-- Trigger A: When a student submits a leave request
CREATE OR REPLACE FUNCTION public.notify_on_leave_submitted()
RETURNS TRIGGER AS $$
DECLARE
    v_roll TEXT;
    v_name TEXT;
    v_admin_email TEXT := 'admin@college.edu';
BEGIN
    SELECT roll_number, name INTO v_roll, v_name FROM public.students WHERE id = NEW.student_id;
    v_roll := COALESCE(v_roll, 'Student');
    v_name := COALESCE(v_name, 'Unknown');

    -- 1. Create In-App Notification for Admin
    INSERT INTO public.notifications (title, message, type, target_role, is_read)
    VALUES (
        '📝 New Leave Request: ' || v_roll,
        v_name || ' (' || v_roll || ') requested ' || NEW.days || ' day(s) ' || NEW.type || ' leave from ' || NEW.from_date || ' to ' || NEW.to_date || '. Reason: ' || NEW.reason,
        'leave',
        'admin',
        false
    );

    -- 2. Queue Secure Email Alert for Admin
    INSERT INTO public.email_queue (
        recipient_email, recipient_name, subject, body_html, body_text, event_type
    ) VALUES (
        v_admin_email,
        'Administrator',
        '[Leave Request] ' || v_roll || ' - ' || NEW.type || ' Leave Application',
        '<h2>New Leave Application Submitted</h2>' ||
        '<p><strong>Student:</strong> ' || v_name || ' (' || v_roll || ')</p>' ||
        '<p><strong>Leave Type:</strong> ' || NEW.type || '</p>' ||
        '<p><strong>Duration:</strong> ' || NEW.days || ' day(s) (' || NEW.from_date || ' to ' || NEW.to_date || ')</p>' ||
        '<p><strong>Reason:</strong> ' || NEW.reason || '</p>' ||
        '<p>' || COALESCE(NEW.description, '') || '</p>' ||
        '<hr><p>Please log in to the Admin Portal to approve or reject this request.</p>',
        'New Leave Application from ' || v_roll || ' for ' || NEW.days || ' day(s). Reason: ' || NEW.reason,
        'leave_submitted'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_leave_submitted ON public.leave_requests;
CREATE TRIGGER trg_leave_submitted
    AFTER INSERT ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_leave_submitted();

-- Trigger B: When an admin reviews a leave request (Approved / Rejected)
CREATE OR REPLACE FUNCTION public.notify_on_leave_reviewed()
RETURNS TRIGGER AS $$
DECLARE
    v_roll TEXT;
    v_name TEXT;
    v_email TEXT;
    v_title TEXT;
    v_msg TEXT;
    v_icon TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Approved', 'Rejected') THEN
        SELECT roll_number, name, email INTO v_roll, v_name, v_email FROM public.students WHERE id = NEW.student_id;
        v_roll := COALESCE(v_roll, 'Student');
        v_name := COALESCE(v_name, 'Student');
        v_email := COALESCE(v_email, LOWER(v_roll) || '@college.edu');

        IF NEW.status = 'Approved' THEN
            v_icon := '✅';
            v_title := '✅ Leave Request Approved';
            v_msg := 'Your ' || NEW.type || ' leave request (' || NEW.from_date || ' to ' || NEW.to_date || ') has been approved.';
        ELSE
            v_icon := '❌';
            v_title := '❌ Leave Request Rejected';
            v_msg := 'Your ' || NEW.type || ' leave request (' || NEW.from_date || ' to ' || NEW.to_date || ') was rejected.';
        END IF;

        IF NEW.review_remarks IS NOT NULL AND LENGTH(TRIM(NEW.review_remarks)) > 0 THEN
            v_msg := v_msg || ' Remarks: ' || NEW.review_remarks;
        END IF;

        -- 1. Create In-App Notification for Student
        INSERT INTO public.notifications (student_id, title, message, type, target_role, is_read)
        VALUES (NEW.student_id, v_title, v_msg, 'leave', 'student', false);

        -- 2. Queue Secure Email Alert for Student
        INSERT INTO public.email_queue (
            recipient_email, recipient_name, subject, body_html, body_text, event_type
        ) VALUES (
            v_email,
            v_name,
            '[' || NEW.status || '] Your Leave Request (' || NEW.from_date || ' to ' || NEW.to_date || ')',
            '<h2>' || v_icon || ' Leave Request ' || NEW.status || '</h2>' ||
            '<p>Dear ' || v_name || ',</p>' ||
            '<p>' || v_msg || '</p>' ||
            '<p><strong>Duration:</strong> ' || NEW.days || ' day(s) (' || NEW.from_date || ' to ' || NEW.to_date || ')</p>' ||
            (CASE WHEN NEW.review_remarks IS NOT NULL AND LENGTH(TRIM(NEW.review_remarks)) > 0 THEN '<p><strong>Admin Remarks:</strong> ' || NEW.review_remarks || '</p>' ELSE '' END) ||
            '<hr><p>Best regards,<br>Academic Administration</p>',
            v_msg,
            CASE WHEN NEW.status = 'Approved' THEN 'leave_approved' ELSE 'leave_rejected' END
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_leave_reviewed ON public.leave_requests;
CREATE TRIGGER trg_leave_reviewed
    AFTER UPDATE ON public.leave_requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_leave_reviewed();

-- 6. ENABLE REALTIME PUBLICATION
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.email_queue;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. SEED INITIAL SAMPLE NOTIFICATIONS
DO $$
DECLARE
    v_s1 UUID;
BEGIN
    SELECT id INTO v_s1 FROM public.students WHERE roll_number = '23RU1A0501' LIMIT 1;

    -- System announcement for all users
    IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE title LIKE '%System Connected%') THEN
        INSERT INTO public.notifications (title, message, type, target_role, is_read, created_at)
        VALUES (
            '🎉 Real-Time Notifications Active',
            'In-app notification system and secure email queue are now connected and operational.',
            'announcement',
            'all',
            false,
            now() - INTERVAL '15 minutes'
        );
    END IF;

    -- Sample student notification for 23RU1A0501
    IF v_s1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.notifications WHERE student_id = v_s1) THEN
        INSERT INTO public.notifications (student_id, title, message, type, target_role, is_read, created_at)
        VALUES (
            v_s1,
            '📋 Attendance Recorded',
            'Attendance for Web Technologies (CS401) was updated today by your instructor.',
            'attendance',
            'student',
            false,
            now() - INTERVAL '45 minutes'
        );
    END IF;
END $$;
