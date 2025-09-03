import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserFilter = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const checkAdminStatus = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setIsAdmin(data?.is_admin || false);
      } catch (err) {
        console.error("Erro ao verificar status de admin:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  const applyUserFilter = useCallback(<T extends { eq: (column: string, value: any) => T }>(query: T, userId: string): T => {
    if (isAdmin) {
      return query;
    }
    return query.eq('usuario_id', userId);
  }, [isAdmin]);

  return useMemo(() => ({
    isAdmin,
    loading,
    currentUserId: user?.id || null,
    applyUserFilter,
  }), [isAdmin, loading, user, applyUserFilter]);
};