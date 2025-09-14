// Seus imports originais, 100% preservados
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMeasurements } from "@/hooks/useMeasurements";
import { useUserFilter } from "@/hooks/useUserFilter";

// Imports para o novo layout consistente
import { ArrowLeft } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import novoLogo from "@/assets/Logo Modificado.png";
import { useAuth } from "@/hooks/useAuth";

// Suas interfaces, mantidas como estão
interface MeasurementResults {
  ci: number | null;
  ciClassification: string;
  cvai: number | null;
  cvaiClassification: string;
  tbc: number | null;
  tbcClassification: string;
}
interface PatientInfo {
  id_paciente: number;
  nome: string;
  data_nascimento: string;
  sexo: string;
}

const MeasurementsRegistration = () => {
  // --- TODA A SUA LÓGICA DE COMPONENTE PERMANECE INTACTA ---
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { loading: userFilterLoading, currentUserId, applyUserFilter } = useUserFilter();
  const pacienteId = searchParams.get("paciente_id");
  const { createMeasurement, loading: savingMeasurement } = useMeasurements();

  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [availablePatients, setAvailablePatients] = useState<PatientInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [measurements, setMeasurements] = useState({
    dataCadastro: new Date().toISOString().split("T")[0],
    pc: "", ap: "", bp: "", pd: "", pe: "", td: "", te: "",
  });
  const [results, setResults] = useState<MeasurementResults>({
    ci: null, ciClassification: "", cvai: null, cvaiClassification: "", tbc: null, tbcClassification: "",
  });

  useEffect(() => {
    if (!userFilterLoading && currentUserId) {
      loadAvailablePatients();
      if (pacienteId) {
        loadPatientData();
      }
    }
  }, [pacienteId, userFilterLoading, currentUserId]);

  // Efeito para pré-selecionar paciente quando vindo da URL
  useEffect(() => {
    if (patientInfo && !searchTerm) {
      setSearchTerm(patientInfo.nome);
    }
  }, [patientInfo]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.patient-search-container')) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Todas as suas funções (loadAvailablePatients, loadPatientData, etc.)
  // permanecem exatamente as mesmas. Nenhuma alteração foi feita nelas.
  const loadAvailablePatients = async () => {
    if (!currentUserId) return;
    
    try {
      setLoadingPatient(true);
      let query = supabase.from("dpacientes").select("id_paciente, nome, data_nascimento, sexo").eq("ativo", true);
      
      // Aplicar filtro de usuário baseado em permissões
      query = applyUserFilter(query, currentUserId);
      
      const { data, error } = await query.order("nome");
      if (error) throw error;
      const patientsWithFormattedDate = data?.map((p) => ({ ...p, data_nascimento: new Date(p.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR"), sexo: p.sexo === "masculino" ? "Masculino" : "Feminino" })) || [];
      setAvailablePatients(patientsWithFormattedDate);
    } catch (error) {
      toast.error("Erro ao carregar lista de pacientes");
    } finally {
      setLoadingPatient(false);
    }
  };

  const loadPatientData = async () => {
    if (!pacienteId || !currentUserId) return;
    try {
      setLoadingPatient(true);
      let query = supabase.from("dpacientes").select("id_paciente, nome, data_nascimento, sexo").eq("id_paciente", parseInt(pacienteId)).eq("ativo", true);
      
      // Aplicar filtro de usuário baseado em permissões
      query = applyUserFilter(query, currentUserId);
      
      const { data, error } = await query.single();
      if (error) { toast.error("Paciente não encontrado ou sem permissão de acesso"); return; }
      if (data) {
        const birthDate = new Date(data.data_nascimento + "T00:00:00");
        setPatientInfo({ id_paciente: data.id_paciente, nome: data.nome, data_nascimento: birthDate.toLocaleDateString("pt-BR"), sexo: data.sexo === "masculino" ? "Masculino" : "Feminino" });
      }
    } catch (error) {
      toast.error("Erro inesperado ao carregar paciente");
    } finally {
      setLoadingPatient(false);
    }
  };

  const selectPatient = (patient: PatientInfo) => {
    setPatientInfo(patient);
    setSearchTerm(patient.nome); // Mostra o nome do paciente no campo de busca
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const filteredPatients = availablePatients.filter(patient =>
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length > 0);
    setSelectedIndex(-1);
    if (value === "") {
      setPatientInfo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredPatients.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredPatients[selectedIndex]) {
          selectPatient(filteredPatients[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const newMeasurements = { ...measurements, [field]: value };
    setMeasurements(newMeasurements);
    calculateResults(newMeasurements);
  };

  const calculateResults = (data: typeof measurements) => {
    const bp = parseFloat(data.bp), ap = parseFloat(data.ap), pd = parseFloat(data.pd), pe = parseFloat(data.pe), td = parseFloat(data.td), te = parseFloat(data.te);
    let newResults: MeasurementResults = { ci: null, ciClassification: "", cvai: null, cvaiClassification: "", tbc: null, tbcClassification: "" };
    if (bp && ap > 0) {
      const ci = (bp / ap) * 100;
      newResults.ci = ci;
      if (ci < 75) newResults.ciClassification = "Dolicocefalia"; else if (ci <= 85) newResults.ciClassification = "Normal"; else newResults.ciClassification = "Braquicefalia";
    }
    if (pd && pe) {
      const maxVal = Math.max(pd, pe), minVal = Math.min(pd, pe);
      if (maxVal > 0) {
        const cvai = ((maxVal - minVal) / maxVal) * 100;
        newResults.cvai = cvai;
        if (cvai < 3.5) newResults.cvaiClassification = "Normal"; else if (cvai <= 6.25) newResults.cvaiClassification = "Leve"; else if (cvai <= 8.75) newResults.cvaiClassification = "Moderada"; else newResults.cvaiClassification = "Grave";
      }
    }
    if (td && te) {
      const tbc = Math.abs(td - te);
      newResults.tbc = tbc;
      if (tbc <= 3) newResults.tbcClassification = "Leve"; else if (tbc <= 6) newResults.tbcClassification = "Moderada"; else newResults.tbcClassification = "Severa";
    }
    setResults(newResults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientInfo) { toast.error("Selecione um paciente antes de salvar."); return; }
    if (measurements.dataCadastro > new Date().toISOString().split("T")[0]) { toast.error("A data de cadastro não pode ser futura."); return; }
    const measurementData = { id_paciente: patientInfo.id_paciente, data_medicao: measurements.dataCadastro, pc: measurements.pc ? parseFloat(measurements.pc) : null, ap: measurements.ap ? parseFloat(measurements.ap) : null, bp: measurements.bp ? parseFloat(measurements.bp) : null, pd: measurements.pd ? parseFloat(measurements.pd) : null, pe: measurements.pe ? parseFloat(measurements.pe) : null, td: measurements.td ? parseFloat(measurements.td) : null, te: measurements.te ? parseFloat(measurements.te) : null, ci: results.ci, cvai: results.cvai, tbc: results.tbc };
    const saved = await createMeasurement(measurementData);
    if (saved) { toast.success("Medidas cadastradas com sucesso!"); navigate("/lista-pacientes"); }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification.toLowerCase()) {
      case "normal": return "text-green-600 bg-green-50 border-green-200";
      case "leve": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "moderada": return "text-orange-600 bg-orange-50 border-orange-200";
      case "grave": case "severa": return "text-red-600 bg-red-50 border-red-200";
      case "dolicocefalia": return "text-blue-600 bg-blue-50 border-blue-200";
      case "braquicefalia": return "text-purple-600 bg-purple-50 border-purple-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };
  // --- FIM DA SUA LÓGICA DE COMPONENTE ---

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Header Padrão e Consistente */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate("/")}>
              <img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" />
              <span className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Simetrik Baby</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* 2. Conteúdo Principal da Página */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(pacienteId ? "/lista-pacientes" : -1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Voltar">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cadastro de Medidas</h1>
            <p className="mt-1 text-lg text-gray-600">Selecione um paciente e insira os valores medidos.</p>
          </div>
        </div>

        {/* Grid principal para formulário e resultados */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Coluna do Formulário de Medidas */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>1. Inserir Medidas</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* SELETOR DE PACIENTE COM BUSCA */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                  <Label htmlFor="patient-search" className="font-semibold">Paciente *</Label>
                  <div className="relative patient-search-container">
                    <Input
                      id="patient-search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setShowDropdown(searchTerm.length > 0)}
                      placeholder="Digite para buscar um paciente..."
                      className="w-full"
                    />
                    {showDropdown && filteredPatients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredPatients.map((patient, index) => (
                          <div
                            key={patient.id_paciente}
                            className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                              index === selectedIndex ? 'bg-blue-100' : ''
                            }`}
                            onClick={() => selectPatient(patient)}
                            onMouseEnter={() => setSelectedIndex(index)}
                          >
                            <div className="font-medium">{patient.nome}</div>
                            <div className="text-sm text-gray-500">
                              {patient.sexo} • Nascimento: {patient.data_nascimento}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showDropdown && filteredPatients.length === 0 && searchTerm.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        <div className="px-4 py-2 text-gray-500 text-center">
                          Nenhum paciente encontrado
                        </div>
                      </div>
                    )}
                  </div>
                  {loadingPatient && <p className="text-sm text-gray-500 mt-1">Carregando pacientes...</p>}
                </div>



                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="dataCadastro">Data da Medição</Label><Input id="dataCadastro" type="date" value={measurements.dataCadastro} onChange={(e) => handleInputChange("dataCadastro", e.target.value)} max={new Date().toISOString().split("T")[0]} required /></div>
                  <div className="space-y-2"><Label htmlFor="pc">Perímetro Craniano (mm)</Label><Input id="pc" type="number" step="0.1" value={measurements.pc} onChange={(e) => handleInputChange("pc", e.target.value)} placeholder="Ex: 350.5" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="ap">Altura Posterior (mm)</Label><Input id="ap" type="number" step="0.1" value={measurements.ap} onChange={(e) => handleInputChange("ap", e.target.value)} placeholder="Ex: 120.0" /></div>
                  <div className="space-y-2"><Label htmlFor="bp">Bitragem Posterior (mm)</Label><Input id="bp" type="number" step="0.1" value={measurements.bp} onChange={(e) => handleInputChange("bp", e.target.value)} placeholder="Ex: 115.3" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="pd">Profundidade Direita (mm)</Label><Input id="pd" type="number" step="0.1" value={measurements.pd} onChange={(e) => handleInputChange("pd", e.target.value)} placeholder="Ex: 80.1" /></div>
                  <div className="space-y-2"><Label htmlFor="pe">Profundidade Esquerda (mm)</Label><Input id="pe" type="number" step="0.1" value={measurements.pe} onChange={(e) => handleInputChange("pe", e.target.value)} placeholder="Ex: 82.4" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="td">Tragus Direito (mm)</Label><Input id="td" type="number" step="0.1" value={measurements.td} onChange={(e) => handleInputChange("td", e.target.value)} placeholder="Ex: 50.0" /></div>
                  <div className="space-y-2"><Label htmlFor="te">Tragus Esquerdo (mm)</Label><Input id="te" type="number" step="0.1" value={measurements.te} onChange={(e) => handleInputChange("te", e.target.value)} placeholder="Ex: 51.2" /></div>
                </div>
                <div className="flex justify-end pt-4"><Button type="submit" disabled={savingMeasurement || !patientInfo}>{savingMeasurement ? "Salvando..." : "Salvar Medidas"}</Button></div>
              </form>
            </CardContent>
          </Card>

          {/* Coluna dos Resultados com FÓRMULAS RESTAURADAS */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>2. Resultados Calculados</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-gray-50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">Índice Cefálico (CI)</h4>
                  {results.ciClassification && <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getClassificationColor(results.ciClassification)}`}>{results.ciClassification}</span>}
                </div>
                <div className="text-3xl font-bold text-gray-900">{results.ci ? results.ci.toFixed(2) : "-"}</div>
                <div className="text-xs text-gray-500 pt-1">Fórmula: (BP / AP) * 100</div>
              </div>
              <div className="p-4 rounded-lg border bg-gray-50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">Índice de Assimetria (CVAI)</h4>
                  {results.cvaiClassification && <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getClassificationColor(results.cvaiClassification)}`}>{results.cvaiClassification}</span>}
                </div>
                <div className="text-3xl font-bold text-gray-900">{results.cvai ? `${results.cvai.toFixed(2)}%` : "-"}</div>
                <div className="text-xs text-gray-500 pt-1">Fórmula: |(PD - PE)| / MÁX(PD, PE) * 100</div>
              </div>
              <div className="p-4 rounded-lg border bg-gray-50 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800">Torção da Base do Crânio (TBC)</h4>
                  {results.tbcClassification && <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getClassificationColor(results.tbcClassification)}`}>{results.tbcClassification}</span>}
                </div>
                <div className="text-3xl font-bold text-gray-900">{results.tbc ? `${results.tbc.toFixed(1)} mm` : "-"}</div>
                <div className="text-xs text-gray-500 pt-1">Fórmula: |Tragus D – Tragus E|</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 3. Rodapé Padrão */}
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
            <p>© {new Date().getFullYear()} AM BI Análises Inteligentes. Todos os direitos reservados.</p>
            <span className="hidden md:inline">•</span>
            <p>Versão 1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MeasurementsRegistration;
