-- ==============================================================================
-- PHASE 3: STUDENT MANAGEMENT & PROFILES MIGRATION
-- ==============================================================================
-- Instructions:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/onsjogeerbffmmiblzca
-- 2. Open "SQL Editor" -> "+ New query".
-- 3. Paste this script and run it (Ctrl + Enter).
-- ==============================================================================

-- 1. UPDATE STUDENTS TABLE SCHEMA
DO $$
BEGIN
    -- Drop the foreign key constraint from id to profiles if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_id_fkey' AND table_name = 'students'
    ) THEN
        ALTER TABLE public.students DROP CONSTRAINT students_id_fkey;
    END IF;
END $$;

-- Ensure id has default gen_random_uuid()
ALTER TABLE public.students ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add missing columns to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS postal TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS emergency_contact_email TEXT;

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON public.students(department);
CREATE INDEX IF NOT EXISTS idx_students_year ON public.students(year);

-- 2. PROFILE & STUDENT SYNC TRIGGER
-- Automatically links student record when a student signs up or logs in
CREATE OR REPLACE FUNCTION public.sync_student_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'student' THEN
        UPDATE public.students
        SET profile_id = NEW.id,
            email = COALESCE(students.email, NEW.email)
        WHERE (profile_id IS NULL OR profile_id = NEW.id)
          AND (
              LOWER(roll_number) = LOWER(split_part(NEW.email, '@', 1))
              OR LOWER(email) = LOWER(NEW.email)
          );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_sync_student ON public.profiles;
CREATE TRIGGER on_profile_sync_student
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_student_profile();

-- 3. PERMISSIONS & ROW LEVEL SECURITY
GRANT ALL ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
GRANT SELECT ON public.students TO anon;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Admins have full management
DROP POLICY IF EXISTS "Admins manage students" ON public.students;
CREATE POLICY "Admins manage students"
    ON public.students FOR ALL
    USING (public.is_admin());

-- Authenticated users (students, teachers, admins) can view students
DROP POLICY IF EXISTS "Authenticated users view students" ON public.students;
DROP POLICY IF EXISTS "Students can view own student record" ON public.students;
CREATE POLICY "Authenticated users view students"
    ON public.students FOR SELECT
    USING (auth.role() = 'authenticated');

-- Students can update their own personal/contact info
DROP POLICY IF EXISTS "Students can update own info" ON public.students;
CREATE POLICY "Students can update own info"
    ON public.students FOR UPDATE
    USING (profile_id = auth.uid() OR public.is_admin())
    WITH CHECK (profile_id = auth.uid() OR public.is_admin());

-- 4. SEED INITIAL 107 STUDENTS
INSERT INTO public.students (roll_number, name, department, year, semester, section, batch)
VALUES
    ('23RU1A0501', 'A.D.SATHISH REDDY', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0502', 'ADDAKULA SAJEEVA RANI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0503', 'ADIVISHNU HITENDRANAG', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0504', 'AREKANTI NAVEEN KUMAR', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0505', 'AYYAPPA REDDY YAMINI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0506', 'BANAGANI SREENATH', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0507', 'BANALA MADHU', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0508', 'BANAVATH MANTHESH NAIK', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0509', 'BANDARU VASUDHA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0510', 'BANDI BHARGAVI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0511', 'BANDI KIRAN KUMAR', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0512', 'BARIKI RAJU', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0513', 'BATTA VENU', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0514', 'BHOGAM MANOHAR', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0515', 'BOGGARAPU NANDINI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0516', 'BOGYAM PRAVEEN KUMAR', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0517', 'BOYA GOPAL', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0518', 'BOYA VINOD', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0519', 'BALGADEE JAGANMOHAN', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0520', 'TARUN SAYIRAM', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0521', 'CHAKALI USHARANI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0522', 'C BHARATH KUMAR REDDY', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0523', 'CHALLA SAILIKHITHA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0524', 'C. BHARATHI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0526', 'DEVARA ANKITHA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0527', 'DUDEKULA JAMALBEE', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0528', 'EERLA NAGAVENNELA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0529', 'GAJJI KURUBA MANOJ', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0530', 'GANDIKOTA MANASA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0531', 'GOLLA MAHESH BABU', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0532', 'GOSALA PUSHPANJALI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0533', 'GOTTIPADU DILIP KUMAR', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0534', 'ILLURI SANDEEP VARDAN', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0535', 'JUTLA GANESH', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0536', 'JYOTHI AKSHAY', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0537', 'KADIRI MADHUSAI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0538', 'KALLA RAGHU', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0539', 'KANUGALLA HARITHA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0540', 'KANUKUNTLA KEERTHI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0541', 'KAPATALA GIRI NARASIMHA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0542', 'KONANGI DURGA RUPESH GOUD', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0543', 'KOSIGI PARAMESH', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0544', 'KUMMARI LAKSHMAN PRADEEP', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0545', 'KUNDAVARAM SATHVIKA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0546', 'POOJITHA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0547', 'KURUVA ABHIMANYU', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0548', 'KURAVA SHIVA PRASAD', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0549', 'LAKKINENI AJITH', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0550', 'LAKKIREDDY LAHARI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0551', 'LANKAYAPALLE RUPA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0552', 'M.SUMERA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0553', 'SUSMITHA. M', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0554', 'M VIJAY RAJ', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0555', 'MADIGA CHAITHANYA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0556', 'MADIGA GOVINDU', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0557', 'MADIGA NAGESWARI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0558', 'MALA RAGHAVENDRA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0559', 'M.ASHOK', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0561', 'MANCHALA GOWTHAM', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0562', 'MANGALA DIVYA SREE', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0563', 'MANGALA SAISANDHYA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0564', 'MARUPATI PAVAN', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0565', 'MOHAMMED ASADULLAH', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0566', 'MOLLA.HAFIZ RAHAMAN', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0567', 'MOTA YUVA RAJU', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0568', 'MUDDAM SHYAM SUNDAR', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0569', 'MULINTI HARSHITHA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0570', 'MULUGURU VAMSI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0571', 'NADIMINTI TEJA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0572', 'PAIENTI LAKSHMI KANTHA REDDY', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0573', 'PALAMARRI GNANA KUMAR', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0574', 'PENKI RAMU', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0575', 'PINJARI CHAND BASHA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0576', 'PINJARI ZUBEDA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0577', 'PITTU SREEVIDYA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0578', 'POTHU PALLAVI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0579', 'POTHULA SAKETH RAM', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0580', 'PUJARI LAKSHMI LOKESH', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0581', 'PUJARI MADHURI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0582', 'P.TEJASWINI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0583', 'SHAIK AFRID', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0585', 'SHAIK ARSHAD', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0586', 'SHAIK CARPENTER MOHAMMED REHAN', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0587', 'SHAIK.MUJIBUR RAHEMAN', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0588', 'SHAIK TAPAL UBEDULLAH', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0589', 'SREENIVASULU GARI BALAJI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0590', 'SREERAMAPPAGARI MAHALAKSHMI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0591', 'TALARI KEERTHANA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0592', 'TELUGU HARSHITH', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0593', 'THADAKARA MADHAN KUMAR', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0594', 'THATHANA BOINA RAMPRASAD', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0595', 'THOGATA YELLA NAGANANDINI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0596', 'THOTA RAJASIMHA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0597', 'TOTTARAMUDI RECHAL', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0598', 'TUMMALAPENTA VENUGOPAL', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A0599', 'UDAYAGIRI NIKHILESWAR', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A05A0', 'UPPARA SRAVANTHI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A05A1', 'UPPARA VENKATESWARI', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A05A2', 'V.KARTHIK', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A05A3', 'VADDE DANIEL', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A05A4', 'VAKKALAGADDA BALA BHARADWAJ', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A05A5', 'Y PRANAY KUMAR REDDY', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A05A6', 'YADAMALA HEMALATHA', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025'),
    ('23RU1A05A7', 'MADIGA KRUPAVARAM', 'CSE', '4th Year', '7th Semester', 'A', '2021-2025')
ON CONFLICT (roll_number) DO UPDATE
SET name = EXCLUDED.name,
    department = EXCLUDED.department,
    year = EXCLUDED.year,
    semester = EXCLUDED.semester,
    section = EXCLUDED.section;
