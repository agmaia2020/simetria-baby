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
  // --- TODA A SUA LÓGICA DE ESTADO E HOOKS PERMANECE INTACTA ---
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
    // Ordenar por data para garantir que o gráfico seja exibido corretamente
    classifiedData.sort((a, b) => new Date(a.data_medicao).getTime() - new Date(b.data_medicao).getTime());
    setMeasurements(classifiedData);
  };

  // --- FUNÇÃO DE CÁLCULO COM CORREÇÃO DEFINITIVA ---
  const calculateIndices = (data: Partial<Measurement>) => {
    const { ap, bp, pd, pe, td, te } = data;
    let ci = data.ci, cvai = data.cvai, tbc = data.tbc;
    
    if (ci === null && ap && bp && ap > 0) ci = (bp / ap) * 100;
    
    // CORREÇÃO DEFINITIVA: Garante que o CVAI seja sempre positivo.
    if (cvai === null && pd && pe) {
        const maxVal = Math.max(pd, pe);
        if (maxVal > 0) {
            cvai = (Math.abs(pd - pe) / maxVal) * 100;
        }
    }
    
    if (tbc === null && td && te) tbc = Math.abs(td - te);
    
    return { ci, cvai, tbc, ciClass: getClassification(ci, 'ci'), cvaiClass: getClassification(cvai, 'cvai'), tbcClass: getClassification(tbc, 'tbc') };
  };

  const getClassification = (value: number | null, type: 'ci' | 'cvai' | 'tbc'): string => { /* ...Sua função sem alterações... */ };
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const getClassificationColor = (classification: string) => { /* ...Sua função de cor... */ };
  const handleEdit = (m: MeasurementDisplay) => { setEditingId(m.id_medida!); setEditingData(m); };
  const handleCancelEdit = () => { setEditingId(null); setEditingData({}); };
  const handleDelete = async (id: number) => { /* ...Sua função sem alterações... */ };
  const handleSaveEdit = async () => { /* ...Sua função sem alterações... */ };
  const handleInputChange = (field: keyof Measurement, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    const updated = { ...editingData, [field]: numValue };
    const indices = calculateIndices(updated);
    setEditingData({ ...updated, ...indices });
  };

  const chartData = measurements.map(m => ({ data: formatDate(m.data_medicao), CI: m.ci, CVAI: m.cvai }));
  // --- FIM DA SUA LÓGICA DE COMPONENTE ---

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Header Padrão e Consistente */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        {/* ... Seu código do header ... */}
      </header>

      {/* 2. Conteúdo Principal da Página */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          {/* ... Seu código do cabeçalho da página ... */}
        </div>

        {/* --- LÓGICA DE EXIBIÇÃO DOS GRÁFICOS CORRIGIDA --- */}
        {/* Só mostra algo depois que o loading terminar */}
        {!loading && (
          <>
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
              <Card className="mb-8 bg-blue-50 border-blue-200">
                <CardContent className="p-6 flex items-center gap-4">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Aguardando mais dados</h4>
                    <p className="text-sm text-blue-700">Os gráficos de evolução aparecerão aqui quando houver duas ou mais medições registradas.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Tabela de Histórico */}
        <Card>
          <CardHeader><CardTitle>Histórico de Medidas</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {/* ... Seu TableHeader ... */}
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={12} className="text-center h-24">Carregando medidas...</TableCell></TableRow>
                  ) : measurements.length === 0 ? (
                    <TableRow><TableCell colSpan={12} className="text-center h-24 text-gray-500">Nenhuma medida encontrada para este paciente.</TableCell></TableRow>
                  ) : (
                    measurements.map((m) => (
                      <TableRow key={m.id_medida}>
                        {/* ... Seu código para renderizar as células ... */}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* 3. Rodapé Padrão */}
      <footer className="mt-16 pb-8 text-center text-gray-500">
        {/* ... Seu código do footer ... */}
      </footer>
    </div>
  );
};

export default PatientEvolution;
