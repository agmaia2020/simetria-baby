-- ========================================
-- FIX: Enable RLS on tables with policies but disabled RLS
-- ========================================

-- Enable RLS on historico_pacientes (CRITICAL - has policies but RLS disabled!)
ALTER TABLE public.historico_pacientes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on fmedidas (CRITICAL - has policies but RLS disabled!)
ALTER TABLE public.fmedidas ENABLE ROW LEVEL SECURITY;

-- Verify all public tables have RLS enabled
-- dpacientes - already enabled ✓
-- usuarios - already enabled ✓
-- user_roles - already enabled ✓