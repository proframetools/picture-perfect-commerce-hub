-- Insert super admin entries into admin_roles table
-- First, we need to get the user IDs for the super admin emails
-- Since these users may not exist yet, we'll create a function to safely insert them

-- Create a function to add super admin role if user exists
CREATE OR REPLACE FUNCTION add_super_admin_role(admin_email text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Get user ID from auth.users based on email
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = admin_email;
    
    -- Only insert if user exists and doesn't already have admin role
    IF user_uuid IS NOT NULL THEN
        INSERT INTO public.admin_roles (user_id, role, granted_by, is_active)
        VALUES (user_uuid, 'super_admin', user_uuid, true)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END;
$$;

-- Call the function for both super admin emails
SELECT add_super_admin_role('getmygrapher@gmail.com');
SELECT add_super_admin_role('proframetools@gmail.com');