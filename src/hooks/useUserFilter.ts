import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserFilter = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    if (!user?.id) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) throw roleError;

      if (roleData) {
        setIsAdmin(true);
      } else {
        const { data, error } = await supabase
          .from('usuarios')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.is_admin || false);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const applyUserFilter = useCallback((query: any, userId?: string) => {
    const finalUserId = userId || user?.id;
    
    console.log('🔧 [useUserFilter] Aplicando filtro:');
    console.log('   - isAdmin:', isAdmin);
    console.log('   - finalUserId:', finalUserId);
    
    if (isAdmin) {
      console.log('👑 [useUserFilter] Usuário é ADMIN - retornando query SEM filtro (todos os registros)');
      return query; // Admin vê todos os registros
    }
    
    console.log('👤 [useUserFilter] Usuário comum - aplicando filtro por usuario_id:', finalUserId);
    return query.eq('usuario_id', finalUserId);
  }, [isAdmin, user?.id]);

  return useMemo(() => ({
    isAdmin,
    loading,
    currentUserId: user?.id || null,
    applyUserFilter,
  }), [isAdmin, loading, user, applyUserFilter]);
};