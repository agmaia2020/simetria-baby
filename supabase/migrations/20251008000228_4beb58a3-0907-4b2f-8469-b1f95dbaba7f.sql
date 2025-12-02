-- ========================================
-- CRITICAL SECURITY FIX: Enable RLS and Fix Role-Based Access
-- ========================================

-- Step 1: Create app_role enum for role management
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Step 2: Create user_roles table (CRITICAL: roles must NOT be on usuarios table)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function to check roles (prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Step 4: Migrate existing admin users from usuarios.is_admin to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM public.usuarios
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 5: ENABLE RLS on dpacientes (CRITICAL - currently disabled!)
ALTER TABLE public.dpacientes ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop overly permissive policies on dpacientes
DROP POLICY IF EXISTS "Enable read for all users" ON public.dpacientes;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.dpacientes;
DROP POLICY IF EXISTS "Permitir atualização" ON public.dpacientes;

-- Step 7: Create secure RLS policies for dpacientes
CREATE POLICY "Users can view their own patients"
ON public.dpacientes
FOR SELECT
TO authenticated
USING (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own patients"
ON public.dpacientes
FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own patients"
ON public.dpacientes
FOR UPDATE
TO authenticated
USING (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own patients"
ON public.dpacientes
FOR DELETE
TO authenticated
USING (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Step 8: Fix overly permissive policies on fmedidas
DROP POLICY IF EXISTS "Enable read for all users" ON public.fmedidas;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.fmedidas;

-- Step 9: Update fmedidas policies to use security definer function
DROP POLICY IF EXISTS "usuario_atualiza_medidas_ou_admin" ON public.fmedidas;
DROP POLICY IF EXISTS "usuario_deleta_medidas_ou_admin" ON public.fmedidas;

CREATE POLICY "Users can view measurements for their patients"
ON public.fmedidas
FOR SELECT
TO authenticated
USING (
  usuario_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert measurements for their patients"
ON public.fmedidas
FOR INSERT
TO authenticated
WITH CHECK (
  usuario_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update their own measurements"
ON public.fmedidas
FOR UPDATE
TO authenticated
USING (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own measurements"
ON public.fmedidas
FOR DELETE
TO authenticated
USING (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Step 10: Update historico_pacientes policies to use security definer function
DROP POLICY IF EXISTS "usuario_ve_historico_ou_admin" ON public.historico_pacientes;
DROP POLICY IF EXISTS "usuario_insere_historico_ou_admin" ON public.historico_pacientes;
DROP POLICY IF EXISTS "usuario_atualiza_historico_ou_admin" ON public.historico_pacientes;
DROP POLICY IF EXISTS "usuario_deleta_historico_ou_admin" ON public.historico_pacientes;

CREATE POLICY "Users can view their patient history"
ON public.historico_pacientes
FOR SELECT
TO authenticated
USING (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their patient history"
ON public.historico_pacientes
FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their patient history"
ON public.historico_pacientes
FOR UPDATE
TO authenticated
USING (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their patient history"
ON public.historico_pacientes
FOR DELETE
TO authenticated
USING (usuario_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Step 11: Add RLS policies for user_roles table
CREATE POLICY "Users can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 12: Fix search_path on existing functions
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Insert user data and assign default 'user' role
  INSERT INTO public.usuarios (id, email, nome, senha_hash)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    'managed_by_supabase_auth'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_historico_paciente()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.historico_pacientes (
        id_paciente,
        dados_anteriores,
        dados_novos,
        usuario_id
    ) VALUES (
        OLD.id_paciente,
        to_jsonb(OLD),
        to_jsonb(NEW),
        auth.uid()
    );
    RETURN NEW;
END;
$function$;