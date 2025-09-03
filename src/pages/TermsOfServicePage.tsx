import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserMenu } from "@/components/auth/UserMenu";
import { useNavigate } from "react-router-dom";
import novoLogo from "@/assets/Logo Modificado.png";

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <img src={novoLogo} alt="Simetrik Baby" className="w-8 h-8" />
              <h1 className="text-xl font-semibold text-gray-900">Simetrik Baby</h1>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Termos de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">1. Aceitação dos Termos</h3>
                <p className="text-gray-700 leading-relaxed">
                  Ao utilizar o sistema Simetrik Baby, você concorda em cumprir e estar vinculado a estes Termos de Serviço. 
                  Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">2. Descrição do Serviço</h3>
                <p className="text-gray-700 leading-relaxed">
                  O Simetrik Baby é um sistema de monitoramento de crescimento infantil que permite o cadastro de pacientes 
                  e registro de medidas cranianas, calculando automaticamente índices importantes como Índice Cefálico (CI), 
                  Índice de Assimetria (CVAI) e Torção da Base do Crânio (TBC).
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">3. Responsabilidades do Usuário</h3>
                <p className="text-gray-700 leading-relaxed">
                  Você é responsável por manter a confidencialidade de sua conta e senha, e por todas as atividades 
                  que ocorrem sob sua conta. Você concorda em notificar imediatamente sobre qualquer uso não autorizado 
                  de sua conta.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">4. Privacidade e Proteção de Dados</h3>
                <p className="text-gray-700 leading-relaxed">
                  Respeitamos sua privacidade e estamos comprometidos em proteger seus dados pessoais e dos pacientes. 
                  Para mais informações, consulte nossa Política de Privacidade.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">5. Limitação de Responsabilidade</h3>
                <p className="text-gray-700 leading-relaxed">
                  O sistema é fornecido "como está" e não garantimos que será ininterrupto ou livre de erros. 
                  Não nos responsabilizamos por danos diretos, indiretos, incidentais ou consequenciais.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">6. Modificações dos Termos</h3>
                <p className="text-gray-700 leading-relaxed">
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor 
                  imediatamente após a publicação. O uso continuado do serviço constitui aceitação dos termos modificados.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">7. Contato</h3>
                <p className="text-gray-700 leading-relaxed">
                  Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco através do email: 
                  <a href="mailto:suporte@simetrikbaby.com" className="text-blue-600 hover:underline">
                    suporte@simetrikbaby.com
                  </a>
                </p>
              </section>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Última atualização: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-8 text-center text-gray-500 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
            <a href="/termos-de-servico" className="hover:text-blue-600 transition-colors">Termos de Serviço</a>
            <span className="hidden md:inline">•</span>
            <a href="/politica-de-privacidade" className="hover:text-blue-600 transition-colors">Política de Privacidade</a>
            <span className="hidden md:inline">•</span>
            <a href="mailto:suporte@simetrikbaby.com" className="hover:text-blue-600 transition-colors">Suporte</a>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 text-sm">
            <p>© {new Date().getFullYear()} Simetrik Baby. Todos os direitos reservados.</p>
            <span className="hidden md:inline">•</span>
            <p>Versão 1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfServicePage;