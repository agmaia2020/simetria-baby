// Seus imports originais, 100% preservados
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";
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
  const loadMeasurements = async () => { /* ...Sua função sem alterações... */ };
  const calculateIndices = (data: Partial<Measurement>) => { /* ...Sua função sem alterações... */ };
  const getClassification = (value: number | null, type: 'ci' | 'cvai' | 'tbc'): string => { /* ...Sua função sem alterações... */ };
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const getClassificationColor = (classification: string) => { /* ...Sua função de cor... */ };
  const handleEdit = (m: MeasurementDisplay) => { /* ...Sua função sem alterações... */ };
  const handleCancelEdit = () => { /* ...Sua função sem alterações... */ };
  const handleDelete = async (id: number) => { /* ...Sua função sem alterações... */ };
  const handleSaveEdit = async () => { /* ...Sua função sem alterações... */ };
  const handleInputChange = (field: keyof Measurement, value: string) => { /* ...Sua função sem alterações... */ };

  const chartData = measurements.map(m => ({ data: formatDate(m.data_medicao), CI: m.ci, CVAI: m.cvai }));

  // --- DADOS PARA AS LEGENDAS ---
  const ciLegend = [
    { name: "Dolicocefalia (< 75)", color: "bg-blue-500" },
    { name: "Normal (75-85)", color: "bg-green-500" },
    { name: "Braquicefalia (> 85)", color: "bg-purple-500" },
  ];

  const cvaiLegend = [
    { name: "Normal (< 3.5%)", color: "bg-green-500" },
    { name: "Leve (3.5-6.25%)", color: "bg-yellow-500" },
    { name: "Moderada (6.25-8.75%)", color: "bg-orange-500" },
    { name: "Grave (> 8.75%)", color: "bg-red-500" },
  ];
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

        {/* GRÁFICOS COM LEGENDAS */}
        {!loading && measurements.length > 1 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico CI */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" />Evolução do Índice Cefálico (CI)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" fontSize={12} />
                    <YAxis domain={[60, 110]} fontSize={12} />
                    <Tooltip />
                    <ReferenceArea y1={85} y2={110} fill="#a855f7" strokeOpacity={0.3} fillOpacity={0.1} />
                    <ReferenceArea y1={75} y2={85} fill="#22c55e" strokeOpacity={0.3} fillOpacity={0.15} />
                    <ReferenceArea y1={60} y2={75} fill="#3b82f6" strokeOpacity={0.3} fillOpacity={0.1} />
                    <Area type="monotone" dataKey="CI" stroke="#1e40af" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} name="Índice Cefálico" />
                  </AreaChart>
                </ResponsiveContainer>
                {/* LEGENDA CUSTOMIZADA */}
                <div className="flex justify-center items-center gap-4 mt-4 text-xs text-gray-600">
                  {ciLegend.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${item.color} opacity-70`}></div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Gráfico CVAI */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-600" />Evolução do CVAI (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" fontSize={12} />
                    <YAxis domain={[0, 15]} fontSize={12} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <ReferenceArea y1={8.75} y2={15} fill="#ef4444" strokeOpacity={0.3} fillOpacity={0.1} />
                    <ReferenceArea y1={6.25} y2={8.75} fill="#f97316" strokeOpacity={0.3} fillOpacity={0.15} />
                    <ReferenceArea y1={3.5} y2={6.25} fill="#f59e0b" strokeOpacity={0.3} fillOpacity={0.15} />
                    <ReferenceArea y1={0} y2={3.5} fill="#22c55e" strokeOpacity={0.3} fillOpacity={0.15} />
                    <Area type="monotone" dataKey="CVAI" stroke="#7c3aed" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} name="CVAI" />
                  </AreaChart>
                </ResponsiveContainer>
                {/* LEGENDA CUSTOMIZADA */}
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-4 text-xs text-gray-600">
                  {cvaiLegend.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${item.color} opacity-70`}></div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mensagem para medição única */}
        {!loading && measurements.length === 1 && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            {/* ... Seu código da mensagem ... */}
          </Card>
        )}

        {/* Tabela de Histórico */}
        <Card>
          {/* ... Seu código da tabela ... */}
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
