import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Verificar se o usuário tem status de admin
        const { data, error } = await supabase
          .from('usuarios')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao verificar status de admin:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.is_admin === true);
        }
      } catch (error) {
        console.error('Erro ao verificar status de admin:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
};