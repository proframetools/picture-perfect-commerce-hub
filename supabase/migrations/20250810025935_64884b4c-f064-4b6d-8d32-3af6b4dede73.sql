-- Upsert super admins into admin_roles for existing users
INSERT INTO public.admin_roles (user_id, role, granted_by, is_active)
SELECT id, 'super_admin', id, true
FROM auth.users 
WHERE email = 'getmygrapher@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.admin_roles (user_id, role, granted_by, is_active)
SELECT id, 'super_admin', id, true
FROM auth.users 
WHERE email = 'proframetools@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;