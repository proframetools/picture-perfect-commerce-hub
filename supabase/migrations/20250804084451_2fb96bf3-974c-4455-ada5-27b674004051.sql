-- RLS Performance Optimization Migration (Tables that exist)
-- Phase 1: Fix Auth Function Re-evaluation
-- Phase 2: Consolidate Multiple Permissive Policies  
-- Phase 3: Security Function Optimization

-- Update is_super_admin function with optimized pattern
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT (auth.jwt() ->> 'email') = 'getmygrapher@gmail.com';
$function$;

-- Drop existing policies that will be replaced (only for existing tables)
DROP POLICY IF EXISTS "Admins can manage aspect ratios" ON public.aspect_ratios;
DROP POLICY IF EXISTS "Anyone can view active aspect ratios" ON public.aspect_ratios;

DROP POLICY IF EXISTS "Anyone can view active frame colors" ON public.frame_colors;
DROP POLICY IF EXISTS "Super admin access" ON public.frame_colors;

DROP POLICY IF EXISTS "Admins can manage frame orientations" ON public.frame_orientations;
DROP POLICY IF EXISTS "Anyone can view active frame orientations" ON public.frame_orientations;

DROP POLICY IF EXISTS "Anyone can view active frame sizes" ON public.frame_sizes;
DROP POLICY IF EXISTS "Super admin access" ON public.frame_sizes;

DROP POLICY IF EXISTS "Anyone can view active frame thickness" ON public.frame_thickness;
DROP POLICY IF EXISTS "Super admin access" ON public.frame_thickness;

DROP POLICY IF EXISTS "Admins can view admin roles" ON public.admin_roles;

DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Anyone can view active product variants" ON public.product_variants;

DROP POLICY IF EXISTS "Anyone can view active matting options" ON public.matting_options;
DROP POLICY IF EXISTS "Super admin access" ON public.matting_options;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Super admin access" ON public.products;

-- Create consolidated, optimized policies

-- aspect_ratios: Single comprehensive policy
CREATE POLICY "Aspect ratios access" ON public.aspect_ratios
FOR ALL 
USING (
  is_active = true OR 
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE admin_roles.user_id = (SELECT auth.uid()) AND admin_roles.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE admin_roles.user_id = (SELECT auth.uid()) AND admin_roles.is_active = true
  )
);

-- frame_colors: Single comprehensive policy
CREATE POLICY "Frame colors access" ON public.frame_colors
FOR ALL
USING (
  is_active = true OR is_super_admin()
)
WITH CHECK (
  is_super_admin()
);

-- frame_orientations: Single comprehensive policy
CREATE POLICY "Frame orientations access" ON public.frame_orientations
FOR ALL
USING (
  is_active = true OR 
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE admin_roles.user_id = (SELECT auth.uid()) AND admin_roles.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE admin_roles.user_id = (SELECT auth.uid()) AND admin_roles.is_active = true
  )
);

-- frame_sizes: Single comprehensive policy
CREATE POLICY "Frame sizes access" ON public.frame_sizes
FOR ALL
USING (
  is_active = true OR is_super_admin()
)
WITH CHECK (
  is_super_admin()
);

-- frame_thickness: Single comprehensive policy
CREATE POLICY "Frame thickness access" ON public.frame_thickness
FOR ALL
USING (
  is_active = true OR is_super_admin()
)
WITH CHECK (
  is_super_admin()
);

-- admin_roles: Optimized policy
CREATE POLICY "Admin roles access" ON public.admin_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_roles ar 
    WHERE ar.user_id = (SELECT auth.uid()) AND ar.is_active = true
  )
);

-- product_variants: Single comprehensive policy
CREATE POLICY "Product variants access" ON public.product_variants
FOR ALL
USING (
  is_active = true OR 
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE admin_roles.user_id = (SELECT auth.uid()) AND admin_roles.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE admin_roles.user_id = (SELECT auth.uid()) AND admin_roles.is_active = true
  )
);

-- matting_options: Single comprehensive policy
CREATE POLICY "Matting options access" ON public.matting_options
FOR ALL
USING (
  is_active = true OR is_super_admin()
)
WITH CHECK (
  is_super_admin()
);

-- products: Single comprehensive policy
CREATE POLICY "Products access" ON public.products
FOR ALL
USING (
  is_active = true OR is_super_admin()
)
WITH CHECK (
  is_super_admin()
);