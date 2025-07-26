// Seus imports originais, 100% preservados
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useMeasurements, Measurement } from "@/hooks/useMeasurements";

// Imports para o novo layout consistente
import { UserCircle, ArrowLeft, Edit, Trash2, Save, X, TrendingUp, Info } from "lucide-react";
import novoLogo from "@/assets/Logo Modificado.png";
import { useAuth } from "@/hooks/useAuth";

// Suas interfaces, mantidas como estão
interface PatientData { id_paciente: number; nome: string; data_nascimento: string; sexo: string; }
interface MeasurementDisplay extends Measurement { ciClass: string; cvaiClass: string; tbcClass: string; }

const PatientEvolution = () => {
  // --- TODA A SUA LÓGICA DE COMPONENTE PERMANECE INTACTA ---
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const pacienteId = searchParams.get("paciente_id");
  const { getMeasurementsByPatientId, updateMeasurement, deleteMeasurement, loading } = useMeasurements();

  const [patientInfo, setPatientInfo] = useState<PatientData | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementDisplay[]>([]);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<MeasurementDisplay>>({});

  useEffect(() => {
    if (!pacienteId) { toast.error("ID do paciente não encontrado"); navigate("/lista-pacientes"); return; }
    loadPatientData();
    loadMeasurements();
  }, [pacienteId, navigate]);

  const loadPatientData = async () => { /* ...Sua função sem alterações... */ };
  const loadMeasurements = async () => {
    if (!pacienteId) return;
    const data = await getMeasurementsByPatientId(parseInt(pacienteId));
    const classifiedData = data.map(m => {
      const indices = calculateIndices(m);
      return { ...m, ...indices };
    });
    setMeasurements(classifiedData);
  };

  // --- FUNÇÃO DE CÁLCULO CORRIGIDA ---
  const calculateIndices = (data: Partial<Measurement>) => {
    const { ap, bp, pd, pe, td, te } = data;
    let ci = data.ci, cvai = data.cvai, tbc = data.tbc;
    
    if (ci === null && ap && bp && ap > 0) ci = (bp / ap) * 100;
    
    // CORREÇÃO: Usando Math.abs() para garantir que o CVAI seja sempre positivo.
    if (cvai === null && pd && pe && Math.max(pd, pe) > 0) {
      cvai = (Math.abs(pd - pe) / Math.max(pd, pe)) * 100;
    }
    
    if (tbc === null && td && te) tbc = Math.abs(td - te);
    
    return { ci, cvai, tbc, ciClass: getClassification(ci, 'ci'), cvaiClass: getClassification(cvai, 'cvai'), tbcClass: getClassification(tbc, 'tbc') };
  };

  const getClassification = (value: number | null, type: 'ci' | 'cvai' | 'tbc'): string => { /* ...Sua função sem alterações... */ };
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const getClassificationColor = (c: string) => { /* ...Sua função de cor... */ };
  const handleEdit = (m: MeasurementDisplay) => { setEditingId(m.id_medida!); setEditingData(m); };
  const handleCancelEdit = () => { setEditingId(null); setEditingData({}); };
  const handleDelete = async (id: number) => { /* ...Sua função sem alterações... */ };
  const handleSaveEdit = async () => { /* ...Sua função sem alterações... */ };
  const handleInputChange = (field: keyof Measurement, value: string) => { /* ...Sua função sem alterações... */ };

  const chartData = measurements.map(m => ({ data: formatDate(m.data_medicao), CI: m.ci, CVAI: m.cvai }));
  // --- FIM DA SUA LÓGICA DE COMPONENTE ---

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Header Padrão e Consistente */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/')}><img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" /><span className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Simetrik Baby</span></div>
            <div className="flex items-center space-x-3">{user && user.name && (<span className="text-base font-medium text-gray-700 hidden sm:block">{user.name}</span>)}<button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"><UserCircle className="w-7 h-7" /></button></div>
          </div>
        </div>
      </header>

      {/* 2. Conteúdo Principal da Página */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/lista-pacientes")} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Voltar para Lista"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
          {loadingPatient ? (<div className="text-lg text-gray-500">Carregando paciente...</div>) : patientInfo ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{patientInfo.nome}</h1>
              <p className="mt-1 text-lg text-gray-600">Evolução das medidas cranianas</p>
            </div>
          ) : (<div className="text-lg text-red-500">Paciente não encontrado.</div>)}
        </div>

        {/* --- LÓGICA DE EXIBIÇÃO DOS GRÁFICOS APRIMORADA --- */}
        {measurements.length > 1 ? (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico CI */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" />Evolução do Índice Cefálico (CI)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {/* ... Seu código do gráfico CI ... */}
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Gráfico CVAI */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-600" />Evolução do CVAI (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {/* ... Seu código do gráfico CVAI ... */}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        ) : measurements.length === 1 && (
          // MENSAGEM INFORMATIVA PARA MEDIÇÃO ÚNICA
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6 flex items-center gap-4">
              <Info className="w-6 h-6 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-800">Aguardando mais dados</h4>
                <p className="text-sm text-blue-700">Os gráficos de evolução aparecerão aqui quando houver duas ou mais medições registradas para este paciente.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Histórico */}
        <Card>
          <CardHeader><CardTitle>Histórico de Medidas</CardTitle></CardHeader>
          <CardContent className="p-0">
            {/* ... Seu código da tabela ... */}
          </CardContent>
        </Card>
      </main>

      {/* 3. Rodapé Padrão */}
      <footer className="mt-16 pb-8 text-center text-gray-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8"><p className="mt-2 text-xs">&copy; {new Date().getFullYear()} Simetrik Baby. Todos os direitos reservados.</p></div>
      </footer>
    </div>
  );
};

export default PatientEvolution;
