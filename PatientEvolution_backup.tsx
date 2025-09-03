import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Label } from "recharts";
import { useMeasurements, Measurement } from "@/hooks/useMeasurements";
import { usePatients } from "@/hooks/usePatients";
import { useAdminCheck } from "@/hooks/useAdminCheck";

// Imports de layout e ícones
import { ArrowLeft, Edit, Trash2, Save, X, TrendingUp, ChevronUp, ChevronDown } from "lucide-react";
import { UserDropdown } from "@/components/UserDropdown";
import novoLogo from "@/assets/Logo Modificado.png";
import { getFormattedAge } from "@/utils/ageCalculator";
import { formatDateToBR } from "@/utils/dateFormatter";
import { useAuth } from "@/hooks/useAuth";

// --- Componentes de Análise (Tooltip e Storytelling) ---
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
  data: Array<{
    data: string;
    [key: string]: string | number;
  }>;
  dataKey: string;
  unit: string;
}

const CustomTooltip = ({ active, payload, label, data, dataKey, unit }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const currentIndex = data.findIndex((d) => d.data === label);
    const currentValue = payload[0].value;
    const currentItem = data[currentIndex];

    let variationText = " (Primeira medição)";
    if (currentIndex > 0) {
      const previousValue = data[currentIndex - 1][dataKey];
      const variation = currentValue - previousValue;
      const sign = variation > 0 ? "+" : "";
      variationText = ` (${sign}${variation.toFixed(2)}${unit} vs. anterior)`;
    }

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <p className="text-sm font-bold text-gray-800">{`Data: ${label}`}</p>
        <p className="text-sm text-blue-600">{`${payload[0].name}: ${currentValue.toFixed(2)}${unit}`}</p>
        <p className="text-xs text-gray-500">{`Classificação: ${currentItem.classification}`}</p>
        <p className="text-xs text-gray-500 italic">{variationText}</p>
      </div>
    );
  }
  return null;
};

interface AnalysisSummaryProps {
  measurements: Array<{
    data: string;
    [key: string]: string | number;
  }>;
  dataKey: string;
  unit: string;
  name: string;
}

const AnalysisSummary = ({ measurements, dataKey, unit, name }: AnalysisSummaryProps) => {
  if (measurements.length < 1) return null;

  const lastMeasurement = measurements[measurements.length - 1];
  const lastValue = lastMeasurement[dataKey];
  const lastClassification = lastMeasurement.classification;

  // Validação de segurança para valores nulos
  if (lastValue === null || lastValue === undefined || !lastClassification) {
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700">
          <strong className="text-gray-900">Dados insuficientes para análise.</strong>
          {" Os valores necessários não estão disponíveis para esta medição."}
        </p>
      </div>
    );
  }

  const part1 = `A medição mais recente, em `;
  const dateText = `${lastMeasurement.data}`;
  const part2 = `, registrou um ${name} de `;
  const valueText = `${lastValue.toFixed(2)}${unit}`;
  const part3 = `, classificado como `;
  const classificationText = `${lastClassification}.`;

  let variationElement = null;

  if (measurements.length > 1) {
    const previousMeasurement = measurements[measurements.length - 2];
    const previousValue = previousMeasurement[dataKey];
    
    // Validação de segurança para o valor anterior
    if (previousValue !== null && previousValue !== undefined) {
      const variation = lastValue - previousValue;
      const trend = variation > 0 ? "um aumento" : "uma redução";
      
      if (Math.abs(variation) < 0.01) {
        variationElement = (
          <span> O valor permaneceu estável em comparação com a medição anterior.</span>
        );
      } else {
        const variationValueText = `${Math.abs(variation).toFixed(2)}${unit}`;
        variationElement = (
          <span>
            {` Isso representa ${trend} de `}
            <strong className="text-gray-900">{variationValueText}</strong>
            {` em relação à medição anterior.`}
          </span>
        );
      }
    } else {
      variationElement = (
        <span> Não foi possível calcular a variação devido a dados insuficientes na medição anterior.</span>
      );
    }
  }

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm text-gray-700">
        {part1}
        <strong className="text-gray-900">{dateText}</strong>
        {part2}
        <strong className="text-gray-900">{valueText}</strong>
        {part3}
        <strong className="text-gray-900">{classificationText}</strong>
        {variationElement}
      </p>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
interface PatientData { id_paciente: number; nome: string; data_nascimento: string; sexo: string; }
interface MeasurementDisplay extends Measurement { ciClass: string; cvaiClass: string; tbcClass: string; }

const PatientEvolution = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { getMeasurementsByPatientId, updateMeasurement, deleteMeasurement, loading: measurementsLoading } = useMeasurements();
  const { getPatientById, loading: patientLoading } = usePatients();

  const pacienteId = searchParams.get("paciente_id");

  const [patientInfo, setPatientInfo] = useState<PatientData | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementDisplay[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<MeasurementDisplay>>({});
  
  // Estados para ordenação da tabela
  const [sortField, setSortField] = useState<string>('data_medicao');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getClassification = useCallback((value: number | null, type: 'ci' | 'cvai' | 'tbc'): string => {
    if (value === null) return "-";
    switch (type) {
      case 'ci': 
        if (value < 70) return "Dolicocefalia Moderada";
        if (value <= 74) return "Dolicocefalia Leve";
        if (value <= 85) return "Normal";
        if (value <= 90) return "Braquicefalia Leve";
        if (value <= 100) return "Braquicefalia Moderada";
        return "Braquicefalia Severa";
      case 'cvai': if (value < 3.5) return "Normal"; if (value <= 6.25) return "Leve"; if (value <= 8.75) return "Moderada"; return "Grave";
      case 'tbc': if (value <= 3) return "Leve"; if (value <= 6) return "Moderada"; return "Severa";
      default: return "-";
    }
  }, []);

  const calculateIndices = useCallback((data: Partial<Measurement>) => {
    const { ap, bp, pd, pe, td, te } = data;
    let ci = data.ci, cvai = data.cvai, tbc = data.tbc;
    if (ci === null && ap && bp && ap > 0) ci = (bp / ap) * 100;
    if (cvai === null && pd && pe) {
        const maxVal = Math.max(pd, pe);
        const minVal = Math.min(pd, pe);
        if (maxVal > 0) cvai = ((maxVal - minVal) / maxVal) * 100;
    }
    if (tbc === null && td && te) tbc = Math.abs(td - te);
    return { ci, cvai, tbc, ciClass: getClassification(ci, 'ci'), cvaiClass: getClassification(cvai, 'cvai'), tbcClass: getClassification(tbc, 'tbc') };
  }, [getClassification]);

  useEffect(() => {
    if (!pacienteId || adminLoading || !user) return;

    const loadPageData = async () => {
      const id = parseInt(pacienteId);
      try {
        const [patientData, measurementData] = await Promise.all([
          getPatientById(id, isAdmin, user.id),
          getMeasurementsByPatientId(id)
        ]);

        if (!patientData) {
          toast.error("Paciente não encontrado ou sem permissão de acesso");
          navigate("/lista-pacientes");
          return;
        }

        setPatientInfo({ 
          id_paciente: patientData.id_paciente, 
          nome: patientData.nome, 
          data_nascimento: patientData.data_nascimento, 
          data_nascimento_formatada: formatDateToBR(patientData.data_nascimento), 
          sexo: patientData.sexo === 'masculino' ? 'Masculino' : 'Feminino' 
        });

        const classifiedData = measurementData.map(m => ({ ...m, ...calculateIndices(m) }));
        setMeasurements(classifiedData);

      } catch (error) {
        toast.error("Ocorreu um erro ao carregar os dados da página.");
        console.error(error);
      }
    };

    loadPageData();
  }, [pacienteId, adminLoading, user, isAdmin, getPatientById, getMeasurementsByPatientId, navigate, calculateIndices]);


  

  
  const getSeverityBadgeClass = (classification: string): string => {
    const lowerCaseClass = classification.toLowerCase();
    
    if (lowerCaseClass.includes("normal")) {
      return "bg-green-500/60 border-green-500/80 text-white";
    }
    if (lowerCaseClass.includes("leve")) {
      return "bg-yellow-500/60 border-yellow-500/80 text-yellow-900";
    }
    if (lowerCaseClass.includes("moderada")) {
      return "bg-orange-500/60 border-orange-500/80 text-white";
    }
    if (lowerCaseClass.includes("severa") || lowerCaseClass.includes("grave")) {
      return "bg-red-500/60 border-red-500/80 text-white";
    }
    // Cor padrão para casos inesperados
    return "bg-gray-200 text-gray-800";
  };
  
  const handleEdit = (m: MeasurementDisplay) => { setEditingId(m.id_medida!); setEditingData(m); };
  const handleCancelEdit = () => { setEditingId(null); setEditingData({}); };
  const handleInputChange = (field: keyof Measurement, value: string) => {
    let processedValue: string | number | null;
    
    if (field === 'data_medicao') {
      // Para data, manter como string
      processedValue = value;
    } else {
      // Para campos numéricos, converter para número
      processedValue = value === "" ? null : parseFloat(value);
    }
    
    const updated = { ...editingData, [field]: processedValue };
    setEditingData({ ...updated, ...calculateIndices(updated) });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !user) return;
    
    // Calcular os índices para obter os valores atualizados
    const calculatedData = { ...editingData, ...calculateIndices(editingData) };
    
    // Filtrar apenas os campos válidos da tabela fmedidas
    const validFields = {
      ...(calculatedData.data_medicao !== undefined && { data_medicao: calculatedData.data_medicao }),
      ...(calculatedData.pc !== undefined && { pc: calculatedData.pc }),
      ...(calculatedData.ap !== undefined && { ap: calculatedData.ap }),
      ...(calculatedData.bp !== undefined && { bp: calculatedData.bp }),
      ...(calculatedData.pd !== undefined && { pd: calculatedData.pd }),
      ...(calculatedData.pe !== undefined && { pe: calculatedData.pe }),
      ...(calculatedData.td !== undefined && { td: calculatedData.td }),
      ...(calculatedData.te !== undefined && { te: calculatedData.te }),
      ...(calculatedData.ci !== undefined && { ci: calculatedData.ci }),
      ...(calculatedData.cvai !== undefined && { cvai: calculatedData.cvai }),
      ...(calculatedData.tbc !== undefined && { tbc: calculatedData.tbc })
    };
    
    console.log('🔄 Dados filtrados para atualização:', validFields);
    
    const success = await updateMeasurement(editingId, validFields);
    if (success) {
      handleCancelEdit();
      toast.success("Medida atualizada!");
      const updatedList = await getMeasurementsByPatientId(parseInt(pacienteId!));
      setMeasurements(updatedList.map(m => ({...m, ...calculateIndices(m)})));
    }
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza?") && user) {
      const ok = await deleteMeasurement(id);
      if (ok) {
        toast.success("Medida excluída!");
        setMeasurements(prev => prev.filter(m => m.id_medida !== id));
      }
    }
  };

  // Função para ordenação da tabela
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para formatar valores com uma casa decimal
  const formatDecimal = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return value.toFixed(1);
  };

  // Ordenar measurements baseado no campo e direção selecionados
  const sortedMeasurements = [...measurements].sort((a, b) => {
    let aValue = a[sortField as keyof MeasurementDisplay];
    let bValue = b[sortField as keyof MeasurementDisplay];

    // Tratamento para valores nulos - colocar no final
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Tratamento especial para data
    if (sortField === 'data_medicao') {
      const dateA = new Date(aValue as string).getTime();
      const dateB = new Date(bValue as string).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }

    // Tratamento para valores numéricos
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Tratamento para strings
    const stringA = String(aValue).toLowerCase();
    const stringB = String(bValue).toLowerCase();
    
    if (stringA < stringB) return sortDirection === 'asc' ? -1 : 1;
    if (stringA > stringB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const chartData = measurements.map(m => ({ data: formatDateToBR(m.data_medicao), CI: m.ci, classification: m.ciClass }));
  const cvaiChartData = measurements.map(m => ({ data: formatDateToBR(m.data_medicao), CVAI: m.cvai, classification: m.cvaiClass }));
  
  // Este array continua sendo a fonte para as cores das ReferenceArea
  const ciReferenceData = [
    { name: "Dolicocefalia Moderada (< 70)", hex: "#f97316" },
    { name: "Dolicocefalia Leve (70-74)", hex: "#f59e0b" },
    { name: "Normal (75-85)", hex: "#22c55e" },
    { name: "Braquicefalia Leve (86-90)", hex: "#f59e0b" },
    { name: "Braquicefalia Moderada (91-100)", hex: "#f97316" },
    { name: "Braquicefalia Severa (101-110)", hex: "#ef4444" },
  ];

  // Este novo array será usado para renderizar a legenda na tela
  const ciDisplayLegend = [
    { name: "Normal", color: "bg-green-500/60" },
    { name: "Leve", color: "bg-yellow-500/60" },
    { name: "Moderado", color: "bg-orange-500/60" },
    { name: "Severo", color: "bg-red-500/60" },
  ];

  const cvaiLegend = [
    { name: "Normal (< 3.5%)", color: "bg-green-500/60", hex: "#22c55e" },
    { name: "Leve (3.5-6.25%)", color: "bg-yellow-500/60", hex: "#f59e0b" },
    { name: "Moderada (6.25-8.75%)", color: "bg-orange-500/60", hex: "#f97316" },
    { name: "Grave (> 8.75%)", color: "bg-red-500/60", hex: "#ef4444" },
  ];
  const isLoading = adminLoading || patientLoading || measurementsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/')}>
              <img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" />
              <span className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Simetrik Baby</span>
            </div>
            <UserDropdown className="flex items-center" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/lista-pacientes")} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Voltar para Lista">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          {isLoading && !patientInfo ? (<div className="text-lg text-gray-500">Carregando paciente...</div>) : patientInfo ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {patientInfo.nome}
                <span className="text-xl font-medium text-gray-600 ml-3">
                  ({getFormattedAge(patientInfo.data_nascimento)})
                </span>
              </h1>
              <p className="mt-1 text-lg text-gray-600">Evolução das medidas cranianas</p>
            </div>
          ) : !isLoading && !patientInfo ? (<div className="text-lg text-red-500">Paciente não encontrado.</div>) : null}
        </div>

        {!isLoading && measurements.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" />Evolução do Índice Cefálico (CI)</CardTitle></CardHeader>
              <CardContent>
                <div className="relative w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 35, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" fontSize={12} />
                      <YAxis 
                        domain={[60, 110]} 
                        fontSize={12} 
                        ticks={[60, 70, 75, 85, 90, 100, 110]} 
                      />
                      <Tooltip content={<CustomTooltip data={chartData} dataKey="CI" unit="" />} />
                      <ReferenceArea y1={100} y2={110} fill={ciReferenceData[5].hex} fillOpacity={0.3} />
                      <ReferenceArea y1={90}  y2={100} fill={ciReferenceData[4].hex} fillOpacity={0.3} />
                      <ReferenceArea y1={85}  y2={90}  fill={ciReferenceData[3].hex} fillOpacity={0.3} />
                      <ReferenceArea y1={75}  y2={85}  fill={ciReferenceData[2].hex} fillOpacity={0.3} />
                      <ReferenceArea y1={70}  y2={75}  fill={ciReferenceData[1].hex} fillOpacity={0.3} />
                      <ReferenceArea y1={60}  y2={70}  fill={ciReferenceData[0].hex} fillOpacity={0.3} />
                      <Line type="monotone" dataKey="CI" stroke="#1e3a8a" strokeWidth={2} name="Índice Cefálico" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* Legenda Vertical com CSS */}
                  <div className="absolute top-0 right-0 h-full flex flex-col justify-center items-center pointer-events-none w-8">
                    <div 
                      className="absolute font-bold text-gray-600 text-xs" 
                      style={{ 
                        writingMode: 'vertical-rl', 
                        transform: 'rotate(180deg)', 
                        top: '40px'  // Posição vertical para Braquicefalia 
                      }} 
                    > 
                      Braquicefalia 
                    </div> 
                    <div 
                      className="absolute font-bold text-gray-600 text-xs" 
                      style={{ 
                        writingMode: 'vertical-rl', 
                        transform: 'rotate(180deg)', 
                        bottom: '35px'  // Posição vertical para Dolicocefalia 
                      }} 
                    > 
                      Dolicocefalia 
                    </div> 
                  </div>
                </div>
                <div className="flex justify-center items-center flex-wrap gap-4 mt-4 text-xs text-gray-600">
                  {ciDisplayLegend.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
                <AnalysisSummary measurements={chartData} dataKey="CI" unit="" name="Índice Cefálico" />
              </CardContent>
            </Card>
            
            {/* Card do CVAI */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-600" />Evolução do CVAI (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cvaiChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" fontSize={12} />
                    <YAxis domain={[0, 15]} fontSize={12} />
                    <Tooltip content={<CustomTooltip data={cvaiChartData} dataKey="CVAI" unit="%" />} />
                    <ReferenceArea y1={8.75} y2={15} fill={cvaiLegend[3].hex} fillOpacity={0.3} />
                    <ReferenceArea y1={6.25} y2={8.75} fill={cvaiLegend[2].hex} fillOpacity={0.3} />
                    <ReferenceArea y1={3.5} y2={6.25} fill={cvaiLegend[1].hex} fillOpacity={0.3} />
                    <ReferenceArea y1={0} y2={3.5} fill={cvaiLegend[0].hex} fillOpacity={0.3} />
                    <Line type="monotone" dataKey="CVAI" stroke="#1e3a8a" strokeWidth={2} name="CVAI" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-4 text-xs text-gray-600">
                  {cvaiLegend.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${item.color}`}></div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
                <AnalysisSummary measurements={cvaiChartData} dataKey="CVAI" unit="%" name="CVAI" />
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader><CardTitle>Histórico de Medidas</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('data_medicao')}>
                      <div className="flex items-center gap-1">
                        Data
                        {sortField === 'data_medicao' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('pc')}>
                      <div className="flex items-center gap-1">
                        PC
                        {sortField === 'pc' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('ap')}>
                      <div className="flex items-center gap-1">
                        AP
                        {sortField === 'ap' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('bp')}>
                      <div className="flex items-center gap-1">
                        BP
                        {sortField === 'bp' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('pd')}>
                      <div className="flex items-center gap-1">
                        PD
                        {sortField === 'pd' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('pe')}>
                      <div className="flex items-center gap-1">
                        PE
                        {sortField === 'pe' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('td')}>
                      <div className="flex items-center gap-1">
                        TD
                        {sortField === 'td' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('te')}>
                      <div className="flex items-center gap-1">
                        TE
                        {sortField === 'te' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('ci')}>
                      <div className="flex items-center gap-1">
                        CI
                        {sortField === 'ci' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('cvai')}>
                      <div className="flex items-center gap-1">
                        CVAI
                        {sortField === 'cvai' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('tbc')}>
                      <div className="flex items-center gap-1">
                        TBC
                        {sortField === 'tbc' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={12} className="text-center h-24">Carregando medidas...</TableCell></TableRow>
                  ) : sortedMeasurements.length === 0 ? (
                    <TableRow><TableCell colSpan={12} className="text-center h-24 text-gray-500">Nenhuma medida encontrada para este paciente.</TableCell></TableRow>
                  ) : (
                    sortedMeasurements.map((m) => (
                      <TableRow key={m.id_medida}>
                        {editingId === m.id_medida ? (
                          <>
                            <TableCell><Input type="date" value={editingData.data_medicao?.split('T')[0] || ""} onChange={(e) => handleInputChange("data_medicao", e.target.value)} className="w-36" /></TableCell>
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
                            <TableCell>{formatDateToBR(m.data_medicao)}</TableCell>
                            <TableCell>{formatDecimal(m.pc)}</TableCell>
                            <TableCell>{formatDecimal(m.ap)}</TableCell>
                            <TableCell>{formatDecimal(m.bp)}</TableCell>
                            <TableCell>{formatDecimal(m.pd)}</TableCell>
                            <TableCell>{formatDecimal(m.pe)}</TableCell>
                            <TableCell>{formatDecimal(m.td)}</TableCell>
                            <TableCell>{formatDecimal(m.te)}</TableCell>
                            <TableCell><Badge variant="outline" className={`font-semibold ${getSeverityBadgeClass(m.ciClass)}`}>{m.ci?.toFixed(2)}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className={`font-semibold ${getSeverityBadgeClass(m.cvaiClass)}`}>{m.cvai?.toFixed(2)}%</Badge></TableCell>
                            <TableCell><Badge variant="outline" className={`font-semibold ${getSeverityBadgeClass(m.tbcClass)}`}>{m.tbc?.toFixed(1)}</Badge></TableCell>
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

      <footer className="mt-16 pb-8 text-center text-gray-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8"><p className="mt-2 text-xs">&copy; {new Date().getFullYear()} Simetrik Baby. Todos os direitos reservados.</p></div>
      </footer>
    </div>
  );
};

export default PatientEvolution;
