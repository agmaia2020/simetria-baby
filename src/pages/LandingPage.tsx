import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Importar imagens - coloque em src/assets/landing/
import logo from '@/assets/landing/logo.jpeg';
import dashboard from '@/assets/landing/dashboard.png';
import painelDeControle from '@/assets/landing/painel_de_controle.png';
import cadastroPaciente from '@/assets/landing/cadastro_paciente.png';
import cadastroMedidas from '@/assets/landing/cadastro_medidas.png';
import evolucaoPaciente from '@/assets/landing/evolucao_paciente.png';
import grafico1 from '@/assets/landing/grafico1.png';
import grafico2 from '@/assets/landing/grafico2.png';

// Importar CSS
import './landing.css';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Form Hero
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form CTA
  const [formDataCTA, setFormDataCTA] = useState({ name: '', email: '', phone: '' });
  const [isLoadingCTA, setIsLoadingCTA] = useState(false);
  const [isSuccessCTA, setIsSuccessCTA] = useState(false);

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Phone mask
  const formatPhone = (value: string) => {
    let numbers = value.replace(/\D/g, '');
    if (numbers.length > 11) numbers = numbers.slice(0, 11);

    if (numbers.length > 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else if (numbers.length > 2) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length > 0) {
      return `(${numbers}`;
    }
    return '';
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent, isCTA = false) => {
    e.preventDefault();

    const data = isCTA ? formDataCTA : formData;
    const setLoading = isCTA ? setIsLoadingCTA : setIsLoading;
    const setSuccess = isCTA ? setIsSuccessCTA : setIsSuccess;

    setLoading(true);

    const leadData = {
      nome: data.name,
      email: data.email,
      telefone: data.phone,
      origem: 'landing_page_beta',
      status: 'novo',
    };

    try {
      const { data: result, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select();

      if (error) {
        throw error;
      }

      console.log('✅ Lead salvo com sucesso:', result);
      setSuccess(true);

      // Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'generate_lead', {
          event_category: 'Beta Signup',
          event_label: 'Landing Page',
        });
      }

      // Facebook Pixel
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead');
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar lead:', error);

      if (error.code === '23505') {
        alert('Este e-mail já está cadastrado! Entraremos em contato em breve.');
        setSuccess(true);
      } else {
        alert('Ocorreu um erro ao enviar. Por favor, tente novamente.');
        setLoading(false);
      }
    }
  };

  // Smooth scroll
  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      const headerHeight = 80;
      const targetPosition =
        element.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header id="header" className={isScrolled ? 'scrolled' : ''}>
        <div className="container">
          <div className="header-inner">
            <a href="#" className="logo">
              <div className="logo-icon">
                <img src={logo} alt="Simetrik Baby" />
              </div>
              <span className="logo-text">
                Simetrik <span>Baby</span>
              </span>
            </a>
            <nav>
              <a
                href="#como-funciona"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToElement('como-funciona');
                }}
              >
                Como Funciona
              </a>
              <a
                href="#recursos"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToElement('recursos');
                }}
              >
                Recursos
              </a>
              <a
                href="#beneficios"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToElement('beneficios');
                }}
              >
                Benefícios
              </a>
            </nav>
            <div className="nav-cta">
                <Link to="/auth" className="btn btn-primary">
                Entrar</Link>
              <a
                href="#signupFormCTA"
                className="btn btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToElement('signupFormCTA');
                }}
              >
                Quero Participar
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-badge">
                <span className="hero-badge-icon">⭐</span>
                Programa de Acesso Antecipado
              </span>
              <h1>
                Seja um dos primeiros a usar o <span>Simetrik Baby</span>
              </h1>
              <p className="hero-description">
                Estamos selecionando fisioterapeutas especializados em assimetria craniana para
                testar gratuitamente nossa plataforma. Ajude a moldar o futuro do acompanhamento
                pediátrico e garanta benefícios exclusivos.
              </p>
              <div className="hero-benefits">
                <div className="hero-benefit">
                  <span className="hero-benefit-icon">✓</span>
                  Acesso gratuito durante o teste
                </div>
                <div className="hero-benefit">
                  <span className="hero-benefit-icon">✓</span>
                  Desconto exclusivo no lançamento
                </div>
                <div className="hero-benefit">
                  <span className="hero-benefit-icon">✓</span>
                  Suporte direto com a equipe
                </div>
              </div>
            </div>

            {/* Signup Card */}
            <div className="signup-card" id="cadastro">
              <div className="signup-header">
                <span className="signup-exclusive">🎯 Vagas Limitadas</span>
                <h2>Garanta seu acesso gratuito</h2>
                <p>Preencha seus dados e entraremos em contato</p>
              </div>

              <form
                className={`signup-form ${isSuccess ? 'hidden' : ''}`}
                onSubmit={(e) => handleSubmit(e, false)}
              >
                <div className="form-group">
                  <label htmlFor="name">Nome completo</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Seu nome"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">E-mail profissional</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="seu@email.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">WhatsApp</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="(00) 00000-0000"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  />
                </div>
                <button
                  type="submit"
                  className={`btn btn-primary ${isLoading ? 'btn-loading' : ''}`}
                  disabled={isLoading}
                >
                  Quero Participar do Teste
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </form>

              <div className={`signup-success ${isSuccess ? 'show' : ''}`}>
                <div className="success-icon">🎉</div>
                <h3>Cadastro realizado!</h3>
                <p>
                  Obrigado por se inscrever! Em breve entraremos em contato pelo WhatsApp com seus
                  dados de acesso à plataforma.
                </p>
              </div>

              <div className="signup-benefits">
                <div className="signup-benefit">
                  <span className="signup-benefit-icon">🔒</span>
                  <span>
                    Seus dados estão <strong>seguros</strong>
                  </span>
                </div>
                <div className="signup-benefit">
                  <span className="signup-benefit-icon">⚡</span>
                  <span>
                    Resposta em até <strong>24 horas</strong>
                  </span>
                </div>
              </div>

              <div className="spots-counter">
                <span className="spots-icon">🔥</span>
                <span className="spots-text">
                  Restam <strong>poucas vagas</strong> para beta testers
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="container">
          <div className="section-header fade-in">
            <span className="section-eyebrow">O Desafio</span>
            <h2 className="section-title">
              Chega de planilhas desorganizadas e cálculos manuais
            </h2>
            <p className="section-subtitle">
              Sabemos como é difícil gerenciar os dados dos pacientes manualmente. A maioria dos
              profissionais ainda enfrenta esses problemas:
            </p>
          </div>
          <div className="problem-grid">
            <div className="problem-card fade-in">
              <div className="problem-icon">📋</div>
              <h3>Dados espalhados</h3>
              <p>
                Informações em papéis, planilhas diferentes e agendas que dificultam o
                acompanhamento consistente dos pacientes.
              </p>
            </div>
            <div className="problem-card fade-in">
              <div className="problem-icon">🧮</div>
              <h3>Cálculos manuais</h3>
              <p>
                Calcular CI, CVAI e TBC manualmente a cada consulta consome tempo precioso e está
                sujeito a erros.
              </p>
            </div>
            <div className="problem-card fade-in">
              <div className="problem-icon">📈</div>
              <h3>Difícil visualizar evolução</h3>
              <p>
                Sem gráficos claros, fica complicado mostrar aos pais o progresso real do
                tratamento ao longo do tempo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="solution-section" id="como-funciona">
        <div className="container">
          <div className="solution-content">
            <div className="solution-visual fade-in">
              <img src={grafico1} alt="Gráficos de Evolução" className="solution-mockup" />
            </div>
            <div className="solution-text">
              <span className="section-eyebrow">A Solução</span>
              <h2 className="section-title">Tudo que você precisa em um só lugar</h2>
              <p className="section-subtitle" style={{ textAlign: 'left', marginBottom: '36px' }}>
                O Simetrik Baby foi desenvolvido por quem entende a rotina do fisioterapeuta
                pediátrico.
              </p>
              <ul className="solution-list">
                <li className="solution-item fade-in">
                  <span className="solution-check">✓</span>
                  <div>
                    <h4>Cadastro simples e rápido</h4>
                    <p>Registre pacientes e medidas em poucos cliques, com interface intuitiva.</p>
                  </div>
                </li>
                <li className="solution-item fade-in">
                  <span className="solution-check">✓</span>
                  <div>
                    <h4>Cálculos automáticos</h4>
                    <p>CI, CVAI e TBC são calculados instantaneamente com classificação visual.</p>
                  </div>
                </li>
                <li className="solution-item fade-in">
                  <span className="solution-check">✓</span>
                  <div>
                    <h4>Gráficos de evolução</h4>
                    <p>
                      Visualize a progressão do tratamento com gráficos coloridos e fáceis de
                      entender.
                    </p>
                  </div>
                </li>
                <li className="solution-item fade-in">
                  <span className="solution-check">✓</span>
                  <div>
                    <h4>Relatórios profissionais</h4>
                    <p>Exporte relatórios em PDF para compartilhar com os pais e médicos.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="recursos">
        <div className="container">
          <div className="section-header fade-in">
            <span className="section-eyebrow">Recursos</span>
            <h2 className="section-title">Funcionalidades pensadas para sua rotina</h2>
            <p className="section-subtitle">
              Cada recurso foi desenvolvido para otimizar seu tempo e melhorar o atendimento.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card fade-in">
              <div className="feature-icon">👶</div>
              <h3>Gestão de Pacientes</h3>
              <p>
                Cadastre e organize todos os seus pacientes com informações completas e de fácil
                acesso.
              </p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">📏</div>
              <h3>Registro de Medidas</h3>
              <p>
                Insira medidas cranianas rapidamente com campos intuitivos e validação automática.
              </p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">🔢</div>
              <h3>Índices Automáticos</h3>
              <p>
                CI, CVAI e TBC calculados na hora com fórmulas precisas e classificação por cores.
              </p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">📊</div>
              <h3>Gráficos de Evolução</h3>
              <p>Acompanhe a progressão visual com gráficos que mostram as zonas de severidade.</p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">📄</div>
              <h3>Relatórios em PDF</h3>
              <p>
                Gere documentos profissionais para entregar aos pais ou enviar para outros médicos.
              </p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">📱</div>
              <h3>Acesso em Qualquer Lugar</h3>
              <p>Plataforma web responsiva que funciona no computador, tablet ou celular.</p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">🔒</div>
              <h3>Dados Seguros</h3>
              <p>
                Seus dados e de seus pacientes protegidos com criptografia e backups automáticos.
              </p>
            </div>
            <div className="feature-card fade-in">
              <div className="feature-icon">📈</div>
              <h3>Dashboard Completo</h3>
              <p>
                Visão geral da sua clínica com estatísticas e métricas importantes em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="screenshots-section">
        <div className="container">
          <div className="section-header fade-in">
            <span className="section-eyebrow">Interface</span>
            <h2 className="section-title">Conheça o sistema por dentro</h2>
            <p className="section-subtitle">
              Uma interface limpa e intuitiva que você aprende a usar em minutos.
            </p>
          </div>

          <div className="screenshots-grid">
            <div className="screenshot-item fade-in">
              <img src={dashboard} alt="Dashboard com Estatísticas" />
              <div className="screenshot-label">Dashboard com Estatísticas Completas</div>
            </div>

            <div className="screenshot-item fade-in">
              <img src={painelDeControle} alt="Painel de Controle" />
              <div className="screenshot-label">Painel de Controle</div>
            </div>

            <div className="screenshots-row">
              <div className="screenshot-item fade-in">
                <img src={cadastroPaciente} alt="Cadastro de Paciente" />
                <div className="screenshot-label">Cadastro de Paciente</div>
              </div>

              <div className="screenshot-item fade-in">
                <img src={cadastroMedidas} alt="Cadastro de Medidas" />
                <div className="screenshot-label">Cadastro de Medidas Cranianas</div>
              </div>
            </div>

            <div className="screenshot-item fade-in">
              <img src={evolucaoPaciente} alt="Histórico de Medidas" />
              <div className="screenshot-label">Histórico de Medidas com Exportação para PDF</div>
            </div>
          </div>

          {/* Gráficos de Evolução */}
          <div className="section-header fade-in" style={{ marginTop: '80px' }}>
            <h2 className="section-title">Gráficos de Evolução</h2>
            <p className="section-subtitle">
              Acompanhe visualmente a progressão do tratamento com classificação por cores.
            </p>
          </div>

          <div className="charts-row">
            <div className="chart-item fade-in">
              <img src={grafico1} alt="Evolução do Índice Cefálico" />
            </div>
            <div className="chart-item fade-in">
              <img src={grafico2} alt="Evolução do CVAI" />
            </div>
          </div>
        </div>
      </section>

      {/* Beta Benefits Section */}
      <section className="beta-benefits-section" id="beneficios">
        <div className="container">
          <div className="section-header fade-in">
            <span className="section-eyebrow">Exclusivo</span>
            <h2 className="section-title">Por que participar do programa beta?</h2>
            <p className="section-subtitle">
              Benefícios exclusivos para quem nos ajudar a construir a melhor plataforma do mercado.
            </p>
          </div>
          <div className="beta-grid">
            <div className="beta-card fade-in">
              <div className="beta-icon">🎁</div>
              <h3>Acesso 100% Gratuito</h3>
              <p>
                Use todas as funcionalidades da plataforma sem pagar nada durante todo o período de
                testes.
              </p>
            </div>
            <div className="beta-card fade-in">
              <div className="beta-icon">💰</div>
              <h3>Desconto no Lançamento</h3>
              <p>
                Beta testers terão desconto exclusivo e permanente quando a plataforma for lançada
                oficialmente.
              </p>
            </div>
            <div className="beta-card fade-in">
              <div className="beta-icon">🎯</div>
              <h3>Influencie o Produto</h3>
              <p>
                Seu feedback será essencial para moldar as funcionalidades e melhorias da
                plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content fade-in">
            <span className="cta-badge">⏰ Vagas Limitadas</span>
            <h2>Não perca essa oportunidade</h2>
            <p>
              <span className="text-white">
                Junte-se aos fisioterapeutas que estão ajudando a criar a ferramenta definitiva para
                acompanhamento de assimetria craniana.
              </span>
            </p>

            <div className="cta-form" id="signupFormCTA">
              <form
                className={`signup-form ${isSuccessCTA ? 'hidden' : ''}`}
                onSubmit={(e) => handleSubmit(e, true)}
              >
                <div className="form-group">
                  <label htmlFor="name2">Nome completo</label>
                  <input
                    type="text"
                    id="name2"
                    name="name"
                    placeholder="Seu nome"
                    required
                    value={formDataCTA.name}
                    onChange={(e) => setFormDataCTA({ ...formDataCTA, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email2">E-mail profissional</label>
                  <input
                    type="email"
                    id="email2"
                    name="email"
                    placeholder="seu@email.com"
                    required
                    value={formDataCTA.email}
                    onChange={(e) => setFormDataCTA({ ...formDataCTA, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone2">WhatsApp</label>
                  <input
                    type="tel"
                    id="phone2"
                    name="phone"
                    placeholder="(00) 00000-0000"
                    required
                    value={formDataCTA.phone}
                    onChange={(e) =>
                      setFormDataCTA({ ...formDataCTA, phone: formatPhone(e.target.value) })
                    }
                  />
                </div>
                <button
                  type="submit"
                  className={`btn btn-primary ${isLoadingCTA ? 'btn-loading' : ''}`}
                  disabled={isLoadingCTA}
                >
                  Garantir Minha Vaga
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </form>

              <div className={`signup-success ${isSuccessCTA ? 'show' : ''}`}>
                <div className="success-icon">🎉</div>
                <h3>Você está na lista!</h3>
                <p style={{ color: 'white' }}>Entraremos em contato em breve pelo WhatsApp.</p>
              </div>

              <div className="signup-benefits">
                <div className="signup-benefit">
                  <span className="signup-benefit-icon">🔒</span>
                  <span>
                    Seus dados estão <strong>seguros</strong>
                  </span>
                </div>
                <div className="signup-benefit">
                  <span className="signup-benefit-icon">⚡</span>
                  <span>
                    Resposta em até <strong>24 horas</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <a href="#" className="logo">
                <div className="logo-icon">
                  <img src={logo} alt="Simetrik Baby" />
                </div>
                <span className="logo-text">
                  Simetrik <span>Baby</span>
                </span>
              </a>
              <p>
                A plataforma completa para acompanhamento de assimetria craniana. Desenvolvido com
                carinho para fisioterapeutas pediátricos.
              </p>
            </div>
            <div className="footer-links">
              <h4>Produto</h4>
              <ul>
                <li>
                  <a
                    href="#recursos"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToElement('recursos');
                    }}
                  >
                    Recursos
                  </a>
                </li>
                <li>
                  <a
                    href="#como-funciona"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToElement('como-funciona');
                    }}
                  >
                    Como Funciona
                  </a>
                </li>
                <li>
                  <a
                    href="#beneficios"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToElement('beneficios');
                    }}
                  >
                    Benefícios
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Suporte</h4>
              <ul>
                <li>
                  <a href="https://wa.me/5531997485478" target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 AM BI Análises Inteligentes. Todos os direitos reservados.</p>
            <div className="footer-legal"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

