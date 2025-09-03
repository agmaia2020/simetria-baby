import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Se o usuário estiver autenticado, redireciona para o painel de controle (Index.tsx)
  if (user) {
    return <Navigate to="/home" replace />;
  }

  // Se não estiver autenticado, redireciona para o login
  return <Navigate to="/auth/login" replace />;
};