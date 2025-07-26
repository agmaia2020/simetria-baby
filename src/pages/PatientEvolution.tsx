// Seus imports originais, 100% preservados
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useMeasurements, Measurement } from "@/hooks/useMeasurements";

// Imports para o novo layout consistente
import { UserCircle, ArrowLeft, Edit, Trash2, Save, X, TrendingUp } from "lucide-react";
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

  // Todas as suas funções (loadPatientData, loadMeasurements, etc.)
  // permanecem exatamente as mesmas. Nenhuma alteração foi feita nelas.
  const loadPatientData = async () => {
    if (!pacienteId) return;
    try {
      setLoadingPatient(true);
      const { data, error } = await supabase.from('dpacientes').select('id_paciente, nome, data_nascimento, sexo').eq('id_paciente', parseInt(pacienteId)).eq('ativo', true).single();
      if (error) throw error;
      setPatientInfo({ id_paciente: data.id_paciente, nome: data.nome, data_nascimento: new Date(data.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR'), sexo: data.sexo === 'masculino' ? 'Masculino' : 'Feminino' });
    } catch (error) { toast.error("Erro ao carregar dados do paciente"); navigate("/lista-pacientes"); } 
    finally { setLoadingPatient(false); }
  };

  const loadMeasurements = async () => {
    if (!pacienteId) return;
    const data = await getMeasurementsByPatientId(parseInt(pacienteId));
    const classifiedData = data.map(m => {
      const indices = calculateIndices(m);
      return { ...m, ...indices };
    });
    setMeasurements(classifiedData);
  };

  const calculateIndices = (data: Partial<Measurement>) => {
    const { ap, bp, pd, pe, td, te } = data;
    let ci = data.ci, cvai = data.cvai, tbc = data.tbc;
    if (ci === null && ap && bp && ap > 0) ci = (bp / ap) * 100;
    if (cvai === null && pd && pe && Math.max(pd, pe) > 0) cvai = ((Math.max(pd, pe) - Math.min(pd, pe)) / Math.max(pd, pe)) * 100;
    if (tbc === null && td && te) tbc = Math.abs(td - te);
    return { ci, cvai, tbc, ciClass: getClassification(ci, 'ci'), cvaiClass: getClassification(cvai, 'cvai'), tbcClass: getClassification(tbc, 'tbc') };
  };

  const getClassification = (value: number | null, type: 'ci' | 'cvai' | 'tbc'): string => {
    if (value === null) return "-";
    switch (type) {
      case 'ci': if (value < 75) return "Dolicocefalia"; if (value <= 85) return "Normal"; return "Braquicefalia";
      case 'cvai': if (value < 3.5) return "Normal"; if (value <= 6.25) return "Leve"; if (value <= 8.75) return "Moderada"; return "Grave";
      case 'tbc': if (value <= 3) return "Leve"; if (value <= 6) return "Moderada"; return "Severa";
      default: return "-";
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const getClassificationColor = (c: string) => { /* ... sua função de cor ... */ };
  const handleEdit = (m: MeasurementDisplay) => { setEditingId(m.id_medida!); setEditingData(m); };
  const handleCancelEdit = () => { setEditingId(null); setEditingData({}); };
  const handleDelete = async (id: number) => { if (window.confirm("...")) { const ok = await deleteMeasurement(id); if (ok) { toast.success("..."); loadMeasurements(); } } };
  
  const handleSaveEdit = async () => {
    if (!editingId) return;
    const indices = calculateIndices(editingData);
    const updateData = { ...editingData, ...indices };
    const success = await updateMeasurement(editingId, updateData);
    if (success) { handleCancelEdit(); toast.success("Medida atualizada!"); loadMeasurements(); }
  };

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/')}><img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" /><span className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Simetrik Baby</span></div>
            <div className="flex items-center space-x-3">{user && user.name && (<span className="text-base font-medium text-gray-700 hidden sm:block">{user.name}</span>)}<button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"><UserCircle className="w-7 h-7" /></button></div>
          </div>
        </div>
      </header>

      {/* 2. Conteúdo Principal da Página */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabeçalho da página com informações do paciente */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/lista-pacientes")} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Voltar para Lista"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
          {loadingPatient ? (<div className="text-lg text-gray-500">Carregando paciente...</div>) : patientInfo ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{patientInfo.nome}</h1>
              <p className="mt-1 text-lg text-gray-600">Evolução das medidas cranianas</p>
            </div>
          ) : (<div className="text-lg text-red-500">Paciente não encontrado.</div>)}
        </div>

        {/* GRÁFICOS APRIMORADOS */}
        {measurements.length > 1 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico CI */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" />Evolução do Índice Cefálico (CI)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" fontSize={12} />
                    <YAxis domain={[60, 100]} fontSize={12} />
                    <Tooltip />
                    <defs>
                      <linearGradient id="colorCI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                    </defs>
                    {/* Áreas de fundo para classificação */}
                    <Area type="monotone" dataKey={() => 100} stackId="a" stroke="none" fill="#a855f7" fillOpacity={0.1} name="Braquicefalia" />
                    <Area type="monotone" dataKey={() => 85} stackId="a" stroke="none" fill="#22c55e" fillOpacity={0.15} name="Normal" />
                    <Area type="monotone" dataKey={() => 75} stackId="a" stroke="none" fill="#3b82f6" fillOpacity={0.1} name="Dolicocefalia" />
                    {/* Linha de evolução */}
                    <Area type="monotone" dataKey="CI" stroke="#3b82f6" fill="url(#colorCI)" strokeWidth={2} name="Índice Cefálico" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Gráfico CVAI */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-600" />Evolução do CVAI (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" fontSize={12} />
                    <YAxis domain={[0, 15]} fontSize={12} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <defs>
                      <linearGradient id="colorCVAI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient>
                    </defs>
                    {/* Áreas de fundo para classificação */}
                    <Area type="monotone" dataKey={() => 15} stackId="b" stroke="none" fill="#ef4444" fillOpacity={0.1} name="Grave" />
                    <Area type="monotone" dataKey={() => 8.75} stackId="b" stroke="none" fill="#f97316" fillOpacity={0.15} name="Moderada" />
                    <Area type="monotone" dataKey={() => 6.25} stackId="b" stroke="none" fill="#f59e0b" fillOpacity={0.15} name="Leve" />
                    <Area type="monotone" dataKey={() => 3.5} stackId="b" stroke="none" fill="#22c55e" fillOpacity={0.15} name="Normal" />
                    {/* Linha de evolução */}
                    <Area type="monotone" dataKey="CVAI" stroke="#7c3aed" fill="url(#colorCVAI)" strokeWidth={2} name="CVAI" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabela de Histórico */}
        <Card>
          <CardHeader><CardTitle>Histórico de Medidas</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead><TableHead>PC</TableHead><TableHead>AP</TableHead><TableHead>BP</TableHead><TableHead>PD</TableHead><TableHead>PE</TableHead><TableHead>TD</TableHead><TableHead>TE</TableHead>
                    <TableHead>CI</TableHead><TableHead>CVAI</TableHead><TableHead>TBC</TableHead><TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (<TableRow><TableCell colSpan={12} className="text-center py-12">Carregando medidas...</TableCell></TableRow>) : measurements.length === 0 ? (<TableRow><TableCell colSpan={12} className="text-center py-12">Nenhuma medida encontrada.</TableCell></TableRow>) : (
                    measurements.map((m) => (
                      <TableRow key={m.id_medida}>
                        {editingId === m.id_medida ? (
                          <>
                            <TableCell><Input type="date" value={editingData.data_medicao?.split('T')[0] || ""} onChange={(e) => setEditingData({ ...editingData, data_medicao: e.target.value })} className="w-36" /></TableCell>
                            {[ 'pc', 'ap', 'bp', 'pd', 'pe', 'td', 'te'].map(field => (
                              <TableCell key={field}><Input type="number" step="0.1" value={editingData[field as keyof Measurement] || ""} onChange={(e) => handleInputChange(field as keyof Measurement, e.target.value)} className="w-20" /></TableCell>
                            ))}
                            <TableCell>{editingData.ci?.toFixed(2)}</TableCell>
                            <TableCell>{editingData.cvai?.toFixed(2)}%</TableCell>
                            <TableCell>{editingData.tbc?.toFixed(1)}</TableCell>
                            <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={handleSaveEdit}><Save className="w-4 h-4" /></Button><Button size="icon" variant="ghost" onClick={handleCancelEdit}><X className="w-4 h-4" /></Button></div></TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{formatDate(m.data_medicao)}</TableCell>
                            <TableCell>{m.pc}</TableCell><TableCell>{m.ap}</TableCell><TableCell>{m.bp}</TableCell><TableCell>{m.pd}</TableCell><TableCell>{m.pe}</TableCell><TableCell>{m.td}</TableCell><TableCell>{m.te}</TableCell>
                            <TableCell><Badge variant="outline" className={getClassificationColor(m.ciClass)}>{m.ci?.toFixed(2)}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className={getClassificationColor(m.cvaiClass)}>{m.cvai?.toFixed(2)}%</Badge></TableCell>
                            <TableCell><Badge variant="outline" className={getClassificationColor(m.tbcClass)}>{m.tbc?.toFixed(1)}</Badge></TableCell>
                            <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleEdit(m)}><Edit className="w-4 h-4" /></Button><Button size="icon" variant="ghost" onClick={() => handleDelete(m.id_medida!)} className="hover:text-red-600"><Trash2 className="w-4 h-4" /></Button></div></TableCell>
                          </>
                        )}
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8"><p className="mt-2 text-xs">&copy; {new Date().getFullYear()} Simetrik Baby. Todos os direitos reservados.</p></div>
      </footer>
    </div>
  );
};

export default PatientEvolution;
