import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Configurar listener de mudanças de auth primeiro
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 [useAuth] Auth state changed:', event, session);
        console.log('🔐 [useAuth] User ID:', session?.user?.id);
        console.log('🔐 [useAuth] User email:', session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 [useAuth] Sessão existente encontrada:', session);
      console.log('🔐 [useAuth] User ID da sessão:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta!",
        });
        // Redireciona para o painel de controle (Index.tsx) após login bem-sucedido
        window.location.href = '/home';
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: nome,
          },
        },
      });
      
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu e-mail para confirmar a conta.",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    console.log('Iniciando logout...');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro no logout do Supabase:', error);
      }
    } catch (error) {
      console.error('Erro inesperado no logout:', error);
    }
    
    // Sempre limpar o estado local independente de erros
    console.log('Limpando estado local...');
    setUser(null);
    setSession(null);
    
    // Mostrar toast de sucesso
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    
    // Sempre redirecionar para login
    console.log('Redirecionando para /auth...');
    window.location.href = '/auth';
  };

  const resetPassword = async (email: string) => {
    try {
      // IMPORTANTE: URL completa com /auth/reset-password
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      
      console.log('🔐 [resetPassword] Enviando reset para:', email);
      console.log('🔐 [resetPassword] Redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error('🔐 [resetPassword] Erro:', error);
        toast({
          title: "Erro ao enviar e-mail",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('🔐 [resetPassword] E-mail enviado com sucesso!');
        toast({
          title: "E-mail enviado!",
          description: "Verifique sua caixa de entrada para redefinir a senha.",
        });
      }
      
      return { error };
    } catch (error: any) {
      console.error('🔐 [resetPassword] Erro inesperado:', error);
      toast({
        title: "Erro ao enviar e-mail",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};