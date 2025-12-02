import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserFilter } from '@/hooks/useUserFilter';

const Debug = () => {
  const { user } = useAuth();
  const { isAdmin, loading: userFilterLoading, currentUserId, applyUserFilter } = useUserFilter();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const runDebug = async () => {
      console.log('🐛 [Debug] Iniciando debug completo...');
      
      const info: any = {
        timestamp: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          exists: !!user
        },
        userFilter: {
          isAdmin,
          loading: userFilterLoading,
          currentUserId
        }
      };

      // Testar consulta direta na tabela usuarios
      if (user?.id) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', user.id)
            .single();
          
          info.userQuery = {
            data: userData,
            error: userError
          };
        } catch (error) {
          info.userQuery = { error };
        }

        // Testar consulta de pacientes sem filtro
        try {
          const { data: allPatients, error: allError } = await supabase
            .from('dpacientes')
            .select('*')
            .eq('ativo', true);
          
          info.allPatients = {
            count: allPatients?.length || 0,
            data: allPatients?.map(p => ({ id: p.id_paciente, nome: p.nome, usuario_id: p.usuario_id })),
            error: allError
          };
        } catch (error) {
          info.allPatients = { error };
        }

        // Testar consulta de pacientes com filtro
        if (!userFilterLoading) {
          try {
            let query = supabase.from('dpacientes').select('*').eq('ativo', true);
            query = applyUserFilter(query, currentUserId);
            
            const { data: filteredPatients, error: filteredError } = await query;
            
            info.filteredPatients = {
              count: filteredPatients?.length || 0,
              data: filteredPatients?.map(p => ({ id: p.id_paciente, nome: p.nome, usuario_id: p.usuario_id })),
              error: filteredError
            };
          } catch (error) {
            info.filteredPatients = { error };
          }
        }
      }

      console.log('🐛 [Debug] Informações coletadas:', info);
      setDebugInfo(info);
    };

    if (user && !userFilterLoading) {
      runDebug();
    }
  }, [user, isAdmin, userFilterLoading, currentUserId]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug - Informações do Sistema</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Informações de Debug</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="mt-6 space-y-4">
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold">Status do Usuário</h3>
          <p>ID: {user?.id || 'Não logado'}</p>
          <p>Email: {user?.email || 'N/A'}</p>
          <p>É Admin: {isAdmin ? 'Sim' : 'Não'}</p>
          <p>Loading: {userFilterLoading ? 'Sim' : 'Não'}</p>
        </div>
        
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-semibold">Contadores</h3>
          <p>Total de Pacientes: {debugInfo.allPatients?.count || 'Carregando...'}</p>
          <p>Pacientes Filtrados: {debugInfo.filteredPatients?.count || 'Carregando...'}</p>
        </div>
      </div>
    </div>
  );
};

export default Debug;