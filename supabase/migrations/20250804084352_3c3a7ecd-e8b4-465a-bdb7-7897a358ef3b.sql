-- RLS Performance Optimization Migration (Final Fix)
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

-- Drop existing policies that will be replaced
DROP POLICY IF EXISTS "Admins can manage aspect ratios" ON public.aspect_ratios;
DROP POLICY IF EXISTS "Anyone can view active aspect ratios" ON public.aspect_ratios;

DROP POLICY IF EXISTS "Super admin access" ON public.cart_items;
DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Super admin access" ON public.categories;

DROP POLICY IF EXISTS "Anyone can view active frame colors" ON public.frame_colors;
DROP POLICY IF EXISTS "Super admin access" ON public.frame_colors;

DROP POLICY IF EXISTS "Admins can manage frame orientations" ON public.frame_orientations;
DROP POLICY IF EXISTS "Anyone can view active frame orientations" ON public.frame_orientations;

DROP POLICY IF EXISTS "Anyone can view active frame sizes" ON public.frame_sizes;
DROP POLICY IF EXISTS "Super admin access" ON public.frame_sizes;

DROP POLICY IF EXISTS "Anyone can view active frame thickness" ON public.frame_thickness;
DROP POLICY IF EXISTS "Super admin access" ON public.frame_thickness;

DROP POLICY IF EXISTS "Super admin access" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

DROP POLICY IF EXISTS "Super admin access" ON public.order_items;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;

DROP POLICY IF EXISTS "Super admin access" ON public.product_reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;

DROP POLICY IF EXISTS "Super admin access" ON public.uploaded_photos;
DROP POLICY IF EXISTS "Users can manage their own photos" ON public.uploaded_photos;

DROP POLICY IF EXISTS "Admins can view admin roles" ON public.admin_roles;

DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Anyone can view active product variants" ON public.product_variants;

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

-- cart_items: Single comprehensive policy
CREATE POLICY "Cart items access" ON public.cart_items
FOR ALL
USING (
  is_super_admin() OR
  ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())) OR
  ((SELECT auth.uid()) IS NULL AND session_id IS NOT NULL)
)
WITH CHECK (
  is_super_admin() OR
  ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())) OR
  ((SELECT auth.uid()) IS NULL AND session_id IS NOT NULL)
);

-- categories: Single comprehensive policy
CREATE POLICY "Categories access" ON public.categories
FOR ALL
USING (
  is_active = true OR is_super_admin()
)
WITH CHECK (
  is_super_admin()
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

-- orders: Separate policies for different operations
CREATE POLICY "Orders select access" ON public.orders
FOR SELECT
USING (
  is_super_admin() OR
  user_id = (SELECT auth.uid()) OR
  (user_id IS NULL AND (SELECT auth.uid()) IS NULL)
);

CREATE POLICY "Orders insert access" ON public.orders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Orders update access" ON public.orders
FOR UPDATE
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Orders delete access" ON public.orders
FOR DELETE
USING (is_super_admin());

-- order_items: Separate policies for different operations
CREATE POLICY "Order items select access" ON public.order_items
FOR SELECT
USING (
  is_super_admin() OR
  order_id IN (
    SELECT orders.id FROM orders 
    WHERE orders.user_id = (SELECT auth.uid()) OR 
          (orders.user_id IS NULL AND (SELECT auth.uid()) IS NULL)
  )
);

CREATE POLICY "Order items insert access" ON public.order_items
FOR INSERT
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Order items update access" ON public.order_items
FOR UPDATE
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Order items delete access" ON public.order_items
FOR DELETE
USING (is_super_admin());

-- product_reviews: Separate policies for different operations
CREATE POLICY "Product reviews select access" ON public.product_reviews
FOR SELECT
USING (
  is_approved = true OR is_super_admin()
);

CREATE POLICY "Product reviews insert access" ON public.product_reviews
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Product reviews update access" ON public.product_reviews
FOR UPDATE
USING (
  user_id = (SELECT auth.uid()) OR is_super_admin()
)
WITH CHECK (
  user_id = (SELECT auth.uid()) OR is_super_admin()
);

CREATE POLICY "Product reviews delete access" ON public.product_reviews
FOR DELETE
USING (is_super_admin());

-- uploaded_photos: Single comprehensive policy
CREATE POLICY "Uploaded photos access" ON public.uploaded_photos
FOR ALL
USING (
  is_super_admin() OR
  ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())) OR
  ((SELECT auth.uid()) IS NULL AND session_id IS NOT NULL)
)
WITH CHECK (
  is_super_admin() OR
  ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())) OR
  ((SELECT auth.uid()) IS NULL AND session_id IS NOT NULL)
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