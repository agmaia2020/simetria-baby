import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserMenu } from "@/components/auth/UserMenu";
import { useNavigate } from "react-router-dom";
import novoLogo from "@/assets/Logo Modificado.png";

const PrivacyPolicyPage = () => {
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
              Política de Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">1. Informações que Coletamos</h3>
                <p className="text-gray-700 leading-relaxed">
                  Coletamos informações que você nos fornece diretamente, como dados de cadastro de usuários e pacientes, 
                  medidas cranianas e outras informações médicas relevantes para o funcionamento do sistema Simetrik Baby.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">2. Como Usamos suas Informações</h3>
                <p className="text-gray-700 leading-relaxed">
                  Utilizamos as informações coletadas para:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                  <li>Fornecer e manter nosso serviço</li>
                  <li>Calcular índices médicos (CI, CVAI, TBC)</li>
                  <li>Gerar relatórios e gráficos de evolução</li>
                  <li>Melhorar a experiência do usuário</li>
                  <li>Comunicar-nos com você sobre o serviço</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">3. Proteção de Dados</h3>
                <p className="text-gray-700 leading-relaxed">
                  Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações 
                  pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Todos os dados são 
                  armazenados de forma segura e criptografada.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">4. Compartilhamento de Informações</h3>
                <p className="text-gray-700 leading-relaxed">
                  Não vendemos, trocamos ou transferimos suas informações pessoais para terceiros, exceto quando:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                  <li>Necessário para cumprir obrigações legais</li>
                  <li>Com seu consentimento explícito</li>
                  <li>Para proteger nossos direitos e segurança</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">5. Retenção de Dados</h3>
                <p className="text-gray-700 leading-relaxed">
                  Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos 
                  nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">6. Seus Direitos</h3>
                <p className="text-gray-700 leading-relaxed">
                  Você tem o direito de:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                  <li>Acessar suas informações pessoais</li>
                  <li>Corrigir dados incorretos ou incompletos</li>
                  <li>Solicitar a exclusão de seus dados</li>
                  <li>Retirar seu consentimento a qualquer momento</li>
                  <li>Portabilidade de dados</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">7. Cookies e Tecnologias Similares</h3>
                <p className="text-gray-700 leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do serviço 
                  e personalizar conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">8. Alterações nesta Política</h3>
                <p className="text-gray-700 leading-relaxed">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças significativas 
                  através do sistema ou por email. O uso continuado do serviço após as alterações constitui aceitação 
                  da política atualizada.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">9. Contato</h3>
                <p className="text-gray-700 leading-relaxed">
                  Se você tiver dúvidas sobre esta Política de Privacidade ou quiser exercer seus direitos, 
                  entre em contato conosco através do email: 
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

export default PrivacyPolicyPage;