-- Setup Super Admin and Admin Management System

-- Update super admin function to include proframetools@gmail.com
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT (auth.jwt() ->> 'email') IN ('getmygrapher@gmail.com', 'proframetools@gmail.com');
$function$;

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  first_name text,
  last_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles" ON public.profiles
FOR SELECT
USING (is_super_admin());

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update admin_roles policies to only allow super admins to manage admins
DROP POLICY IF EXISTS "Admin roles access" ON public.admin_roles;

-- Only super admins can view admin roles
CREATE POLICY "Super admins can view admin roles" ON public.admin_roles
FOR SELECT
USING (is_super_admin());

-- Only super admins can insert admin roles
CREATE POLICY "Super admins can create admin roles" ON public.admin_roles
FOR INSERT
WITH CHECK (is_super_admin());

-- Only super admins can update admin roles
CREATE POLICY "Super admins can update admin roles" ON public.admin_roles
FOR UPDATE
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Only super admins can delete admin roles
CREATE POLICY "Super admins can delete admin roles" ON public.admin_roles
FOR DELETE
USING (is_super_admin());

-- Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();