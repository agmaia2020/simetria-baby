
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import novoLogo from '@/assets/Logo Modificado.png';

const AuthPage = () => {
  const { type } = useParams<{ type: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/Index');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (user) {
    return null; // Será redirecionado pelo useEffect
  }

  const renderForm = () => {
    switch (type) {
      case 'forgot-password':
        return <ForgotPasswordForm />;
      default:
        return <LoginForm />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Logotipo centralizado */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center mb-8">
          <img src={novoLogo} alt="Logo Simetrik Baby" className="h-12 w-auto mb-3" />
          <span className="text-3xl font-bold text-gray-800">Simetrik Baby</span>
        </div>
        {renderForm()}
      </div>
      
      {/* Rodapé Padrão */}
      <footer className="pb-8 text-center text-gray-500">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
            <span onClick={() => navigate('/termos-de-servico')} className="hover:text-blue-600 transition-colors cursor-pointer">Termos de Serviço</span>
            <span className="hidden md:inline">•</span>
            <span onClick={() => navigate('/politica-de-privacidade')} className="hover:text-blue-600 transition-colors cursor-pointer">Política de Privacidade</span>
            <span className="hidden md:inline">•</span>
            <a href="mailto:suporte@simetrikbaby.com" className="hover:text-blue-600 transition-colors">Suporte</a>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 text-sm">
            <p>© {new Date().getFullYear()} AM BI Análises Inteligentes. Todos os direitos reservados.</p>
            <span className="hidden md:inline">•</span>
            <p>Versão 1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthPage;
