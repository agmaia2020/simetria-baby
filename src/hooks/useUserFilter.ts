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
        // Check if user has admin role in user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        if (error) throw error;
        setIsAdmin(data !== null);
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