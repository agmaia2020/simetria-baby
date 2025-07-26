// Seus imports originais, 100% preservados
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMeasurements } from "@/hooks/useMeasurements";

// Imports para o novo layout consistente
import { UserCircle, ArrowLeft, Search } from "lucide-react";
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
  const pacienteId = searchParams.get("paciente_id");
  const { createMeasurement, loading: savingMeasurement } = useMeasurements();
  
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [availablePatients, setAvailablePatients] = useState<PatientInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [measurements, setMeasurements] = useState({
    dataCadastro: new Date().toISOString().split('T')[0],
    pc: "", ap: "", bp: "", pd: "", pe: "", td: "", te: ""
  });
  const [results, setResults] = useState<MeasurementResults>({
    ci: null, ciClassification: "", cvai: null, cvaiClassification: "", tbc: null, tbcClassification: ""
  });

  useEffect(() => {
    loadAvailablePatients();
    if (pacienteId) {
      loadPatientData();
    }
  }, [pacienteId]);

  // Todas as suas funções (loadAvailablePatients, loadPatientData, selectPatient, etc.)
  // permanecem exatamente as mesmas. Nenhuma alteração foi feita nelas.
  const loadAvailablePatients = async () => {
    try {
      setLoadingPatient(true);
      const { data, error } = await supabase.from('dpacientes').select('id_paciente, nome, data_nascimento, sexo').eq('ativo', true).order('nome');
      if (error) throw error;
      const patientsWithFormattedDate = data?.map(p => ({ ...p, data_nascimento: new Date(p.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR'), sexo: p.sexo === 'masculino' ? 'Masculino' : 'Feminino' })) || [];
      setAvailablePatients(patientsWithFormattedDate);
    } catch (error) { toast.error("Erro ao carregar lista de pacientes"); } 
    finally { setLoadingPatient(false); }
  };

  const loadPatientData = async () => {
    if (!pacienteId) return;
    try {
      setLoadingPatient(true);
      const { data, error } = await supabase.from('dpacientes').select('id_paciente, nome, data_nascimento, sexo').eq('id_paciente', parseInt(pacienteId)).eq('ativo', true).single();
      if (error) { toast.error("Paciente não encontrado"); return; }
      if (data) {
        const birthDate = new Date(data.data_nascimento + 'T00:00:00');
        setPatientInfo({ id_paciente: data.id_paciente, nome: data.nome, data_nascimento: birthDate.toLocaleDateString('pt-BR'), sexo: data.sexo === 'masculino' ? 'Masculino' : 'Feminino' });
      }
    } catch (error) { toast.error("Erro inesperado ao carregar paciente"); } 
    finally { setLoadingPatient(false); }
  };

  const selectPatient = (patientId: string) => {
    const patient = availablePatients.find(p => p.id_paciente.toString() === patientId);
    if (patient) setPatientInfo(patient);
  };

  const filteredPatients = availablePatients.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleInputChange = (field: string, value: string) => {
    const newMeasurements = { ...measurements, [field]: value };
    setMeasurements(newMeasurements);
    calculateResults(newMeasurements);
  };

  const calculateResults = (data: typeof measurements) => {
    const bp = parseFloat(data.bp), ap = parseFloat(data.ap), pd = parseFloat(data.pd), pe = parseFloat(data.pe), td = parseFloat(data.td), te = parseFloat(data.te);
    let newResults: MeasurementResults = { ci: null, ciClassification: "", cvai: null, cvaiClassification: "", tbc: null, tbcClassification: "" };
    if (bp && ap > 0) {
      const ci = bp / ap * 100;
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
    if (measurements.dataCadastro > new Date().toISOString().split('T')[0]) { toast.error("A data de cadastro não pode ser futura."); return; }
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
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/')}>
              <img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" />
              <span className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Simetrik Baby</span>
            </div>
            <div className="flex items-center space-x-3">
              {user && user.name && (<span className="text-base font-medium text-gray-700 hidden sm:block">{user.name}</span>)}
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"><UserCircle className="w-7 h-7" /></button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Conteúdo Principal da Página */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabeçalho da página com Botão de Voltar */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(pacienteId ? "/lista-pacientes" : -1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Voltar">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cadastro de Medidas</h1>
            <p className="mt-1 text-lg text-gray-600">Selecione um paciente e insira os valores medidos.</p>
          </div>
        </div>

        {/* Card de Seleção de Paciente */}
        <Card className="mb-8">
          <CardHeader><CardTitle>1. Selecionar Paciente</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar Paciente por Nome</Label>
              <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="search" type="text" placeholder="Digite para buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-select">Selecionar da Lista</Label>
              <Select value={patientInfo?.id_paciente.toString() || ""} onValueChange={selectPatient}><SelectTrigger id="patient-select"><SelectValue placeholder="Selecione um paciente da lista" /></SelectTrigger><SelectContent>{filteredPatients.map(p => <SelectItem key={p.id_paciente} value={p.id_paciente.toString()}>{p.nome}</SelectItem>)}</SelectContent></Select>
              {loadingPatient && <p className="text-sm text-gray-500 mt-1">Carregando pacientes...</p>}
              {!loadingPatient && filteredPatients.length === 0 && <p className="text-sm text-gray-500 mt-1">{searchTerm ? "Nenhum paciente encontrado." : "Nenhum paciente ativo cadastrado."}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Grid principal para formulário e resultados */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Coluna do Formulário de Medidas */}
          <Card>
            <CardHeader><CardTitle>2. Inserir Medidas</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="dataCadastro">Data da Medição</Label><Input id="dataCadastro" type="date" value={measurements.dataCadastro} onChange={e => handleInputChange("dataCadastro", e.target.value)} max={new Date().toISOString().split('T')[0]} required /></div>
                  <div className="space-y-2"><Label htmlFor="pc">Perímetro Craniano (mm)</Label><Input id="pc" type="number" step="0.1" value={measurements.pc} onChange={e => handleInputChange("pc", e.target.value)} placeholder="Ex: 350.5" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="ap">Altura Posterior (mm)</Label><Input id="ap" type="number" step="0.1" value={measurements.ap} onChange={e => handleInputChange("ap", e.target.value)} placeholder="Ex: 120.0" /></div>
                  <div className="space-y-2"><Label htmlFor="bp">Bitragem Posterior (mm)</Label><Input id="bp" type="number" step="0.1" value={measurements.bp} onChange={e => handleInputChange("bp", e.target.value)} placeholder="Ex: 115.3" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="pd">Profundidade Direita (mm)</Label><Input id="pd" type="number" step="0.1" value={measurements.pd} onChange={e => handleInputChange("pd", e.target.value)} placeholder="Ex: 80.1" /></div>
                  <div className="space-y-2"><Label htmlFor="pe">Profundidade Esquerda (mm)</Label><Input id="pe" type="number" step="0.1" value={measurements.pe} onChange={e => handleInputChange("pe", e.target.value)} placeholder="Ex: 82.4" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="td">Tragus Direito (mm)</Label><Input id="td" type="number" step="0.1" value={measurements.td} onChange={e => handleInputChange("td", e.target.value)} placeholder="Ex: 50.0" /></div>
                  <div className="space-y-2"><Label htmlFor="te">Tragus Esquerdo (mm)</Label><Input id="te" type="number" step="0.1" value={measurements.te} onChange={e => handleInputChange("te", e.target.value)} placeholder="Ex: 51.2" /></div>
                </div>
                <div className="flex justify-end pt-4"><Button type="submit" disabled={savingMeasurement || !patientInfo}>{savingMeasurement ? "Salvando..." : "Salvar Medidas"}</Button></div>
              </form>
            </CardContent>
          </Card>

          {/* Coluna dos Resultados */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>3. Resultados Calculados</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-3 rounded-lg border ${getClassificationColor(results.ciClassification)}`}><h4 className="font-semibold text-sm mb-1">Índice Cefálico (CI)</h4><div className="flex justify-between items-baseline"><span className="text-2xl font-bold">{results.ci ? results.ci.toFixed(2) : "-"}</span>{results.ciClassification && <span className="px-2 py-0.5 rounded-full text-xs font-medium">{results.ciClassification}</span>}</div></div>
                <div className={`p-3 rounded-lg border ${getClassificationColor(results.cvaiClassification)}`}><h4 className="font-semibold text-sm mb-1">Índice de Assimetria (CVAI)</h4><div className="flex justify-between items-baseline"><span className="text-2xl font-bold">{results.cvai ? `${results.cvai.toFixed(2)}%` : "-"}</span>{results.cvaiClassification && <span className="px-2 py-0.5 rounded-full text-xs font-medium">{results.cvaiClassification}</span>}</div></div>
                <div className={`p-3 rounded-lg border ${getClassificationColor(results.tbcClassification)}`}><h4 className="font-semibold text-sm mb-1">Torção da Base do Crânio (TBC)</h4><div className="flex justify-between items-baseline"><span className="text-2xl font-bold">{results.tbc ? `${results.tbc.toFixed(1)} mm` : "-"}</span>{results.tbcClassification && <span className="px-2 py-0.5 rounded-full text-xs font-medium">{results.tbcClassification}</span>}</div></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 3. Rodapé Padrão */}
      <footer className="mt-16 pb-8 text-center text-gray-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8"><p className="mt-2 text-xs">&copy; {new Date().getFullYear()} Simetrik Baby. Todos os direitos reservados.</p></div>
      </footer>
    </div>
  );
};

export default MeasurementsRegistration;
