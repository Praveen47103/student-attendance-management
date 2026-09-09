-- ==============================================================================
-- STUDENT ATTENDANCE MANAGEMENT SYSTEM — ADMIN AUTHENTICATION SETUP
-- ==============================================================================
-- Run this in Supabase Dashboard: SQL Editor -> New query -> Paste -> Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_id UUID;
    v_admin_email TEXT := 'admin@college.edu';
    v_admin_password TEXT := 'kumar@123';
BEGIN
    -- 1. Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_admin_email LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- User exists: update password securely
        UPDATE auth.users
        SET encrypted_password = crypt(v_admin_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            raw_user_meta_data = jsonb_build_object('role', 'admin', 'full_name', 'System Administrator'),
            updated_at = now()
        WHERE id = v_user_id;
        RAISE NOTICE 'Password updated for existing user: %', v_admin_email;
    ELSE
        -- User does not exist: create user
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            v_admin_email,
            crypt(v_admin_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"role":"admin","full_name":"System Administrator"}'::jsonb,
            now(),
            now()
        );
        RAISE NOTICE 'Created new auth user: %', v_admin_email;
    END IF;

    -- 2. Link with public.profiles
    INSERT INTO public.profiles (id, email, full_name, role, updated_at)
    VALUES (v_user_id, v_admin_email, 'System Administrator', 'admin', now())
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', full_name = 'System Administrator', updated_at = now();

    UPDATE public.profiles SET role = 'admin' WHERE email = v_admin_email;
    RAISE NOTICE 'Profile successfully configured with role=admin';
END $$;
