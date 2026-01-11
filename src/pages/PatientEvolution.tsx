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
import { useUserFilter } from "@/hooks/useUserFilter";
import { usePatientPdfExport } from "@/hooks/usePatientPdfExport";
import { usePatientImageExport } from "@/hooks/usePatientImageExport.ts";
import { supabase } from "@/integrations/supabase/client";

// Imports de layout e ícones
import { ArrowLeft, Edit, Trash2, Save, X, TrendingUp, FileDown, ImageDown } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import novoLogo from "@/assets/Logo Modificado.png";
import { useAuth } from "@/hooks/useAuth";

// Import do Modal de Seleção de Fotos Comparativas
import PhotoComparisonModal, { PhotoPairForExport } from "@/components/photos/PhotoComparisonModal";

// --- Componentes de Análise (Tooltip e Storytelling) ---
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  data: Array<{ data: string; [key: string]: number | string; classification: string }>;
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
      const previousValue = Number(data[currentIndex - 1][dataKey]);
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
  measurements: Array<{ data: string; [key: string]: number | string; classification: string }>;
  dataKey: 'CI' | 'CVAI';
  unit: string;
  name: string;
}

const AnalysisSummary = ({ measurements, dataKey, unit, name }: AnalysisSummaryProps) => {
  if (measurements.length < 1) return null;

  const lastMeasurement = measurements[measurements.length - 1];
  const lastValue = lastMeasurement[dataKey];
  const lastClassification = lastMeasurement.classification;

  // Verificar se lastValue é válido antes de usar toFixed
  if (lastValue === null || lastValue === undefined || isNaN(Number(lastValue))) {
    return null;
  }

  const part1 = `A medição mais recente, em `;
  const dateText = `${lastMeasurement.data}`;
  const part2 = `, registrou um ${name} de `;
  const valueText = `${Number(lastValue).toFixed(2)}${unit}`;
  const part3 = `, classificado como `;
  const classificationText = `${lastClassification}.`;

  let variationElement = null;

  if (measurements.length > 1) {
    const previousMeasurement = measurements[measurements.length - 2];
      const previousValue = Number(previousMeasurement[dataKey]);
    
    // Verificar se previousValue é válido antes de calcular variação
    if (previousValue !== null && previousValue !== undefined && !isNaN(previousValue)) {
      const variation = Number(lastValue) - previousValue;
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
  const { loading: userFilterLoading, currentUserId, applyUserFilter } = useUserFilter();

  const pacienteId = searchParams.get("paciente_id");

  const [patientInfo, setPatientInfo] = useState<PatientData | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementDisplay[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<MeasurementDisplay>>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Estado para controlar o modal de seleção de fotos
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoPairsForExport, setPhotoPairsForExport] = useState<PhotoPairForExport[]>([]);

  // Hook de exportação de PDF
  const { exportToPdf, isExporting } = usePatientPdfExport({
    patientInfo,
    measurements,
    userName,
    onExportStart: () => setIsExportingPdf(true),
    onExportEnd: () => setIsExportingPdf(false),
  });

  // Hook de exportação de Imagens (NOVO)
  const { exportToImages, isExportingImages } = usePatientImageExport({
    patientInfo,
    onExportStart: () => setIsExportingPdf(true),  // Reutiliza o mesmo estado para mostrar eixo Y
    onExportEnd: () => setIsExportingPdf(false),
  });

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
    let ci: number | null = null;
    let cvai: number | null = null;
    let tbc: number | null = null;
    
    // Sempre recalcular CI se AP e BP existirem
    if (ap && bp && ap > 0) {
      ci = (bp / ap) * 100;
    }
    
    // Sempre recalcular CVAI se PD e PE existirem
    if (pd && pe) {
      const maxVal = Math.max(pd, pe);
      const minVal = Math.min(pd, pe);
      if (maxVal > 0) {
        cvai = ((maxVal - minVal) / maxVal) * 100;
      }
    }
    
    // Sempre recalcular TBC se TD e TE existirem
    if (td && te) {
      tbc = Math.abs(td - te);
    }
    
    return { 
      ci, 
      cvai, 
      tbc, 
      ciClass: getClassification(ci, 'ci'), 
      cvaiClass: getClassification(cvai, 'cvai'), 
      tbcClass: getClassification(tbc, 'tbc') 
    };
  }, [getClassification]);

  // Função para aplicar carry forward nos dados do gráfico
  // Mantém valores nulos na primeira medição, mas usa o último valor válido para medições subsequentes
  const applyCarryForward = <T extends Record<string, unknown>>(
    data: T[],
    valueKey: string
  ): T[] => {
    let lastValidValue: number | null = null;
    
    return data.map((item, index) => {
      const currentValue = item[valueKey] as number | null;
      
      if (currentValue !== null && currentValue !== undefined && !isNaN(Number(currentValue))) {
        lastValidValue = currentValue;
        return item;
      } else if (index > 0 && lastValidValue !== null) {
        // Carry forward: usar o último valor válido (apenas após a primeira medição)
        return { ...item, [valueKey]: lastValidValue };
      }
      
      return item;
    });
  };

  // Função para aplicar carry forward nos valores de CI e CVAI das medições
  // Quando não há parâmetros para calcular, usa o valor da medição anterior
  const applyMeasurementsCarryForward = (data: MeasurementDisplay[]): MeasurementDisplay[] => {
    let lastValidCI: number | null = null;
    let lastValidCVAI: number | null = null;
    let lastValidCIClass: string = "-";
    let lastValidCVAIClass: string = "-";
    
    return data.map((item, index) => {
      const newItem = { ...item };
      
      // CI: verificar se tem valor válido
      if (newItem.ci !== null && newItem.ci !== undefined && !isNaN(Number(newItem.ci))) {
        lastValidCI = newItem.ci;
        lastValidCIClass = newItem.ciClass;
      } else if (index > 0 && lastValidCI !== null) {
        // Carry forward para CI
        newItem.ci = lastValidCI;
        newItem.ciClass = lastValidCIClass;
      }
      
      // CVAI: verificar se tem valor válido
      if (newItem.cvai !== null && newItem.cvai !== undefined && !isNaN(Number(newItem.cvai))) {
        lastValidCVAI = newItem.cvai;
        lastValidCVAIClass = newItem.cvaiClass;
      } else if (index > 0 && lastValidCVAI !== null) {
        // Carry forward para CVAI
        newItem.cvai = lastValidCVAI;
        newItem.cvaiClass = lastValidCVAIClass;
      }
      
      return newItem;
    });
  };

  // Carregar nome do usuário
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user?.id) {
        setUserName("");
        return;
      }
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar nome do usuário:', error);
          setUserName(user.email || "");
        } else {
          setUserName(data?.nome || user.email || "");
        }
      } catch (error) {
        console.error('Erro ao buscar nome do usuário:', error);
        setUserName(user.email || "");
      }
    };
    fetchUserName();
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (!pacienteId || adminLoading || userFilterLoading || !user || !currentUserId || dataLoaded) return;

    const loadPageData = async () => {
      const id = parseInt(pacienteId);
      try {
        console.log('Carregando dados para paciente ID:', id, 'usuário:', user.id, 'isAdmin:', isAdmin);
        
        // Carregar dados do paciente com filtro de usuário
        const patientData = await getPatientById(id);
        
        if (!patientData) {
          console.error('Paciente não encontrado');
          toast.error("Paciente não encontrado");
          navigate("/lista-pacientes");
          return;
        }

        // Permissions are enforced by RLS policies
        // No need for client-side permission checks

        console.log('Dados do paciente carregados:', patientData);
        setPatientInfo({ 
          id_paciente: patientData.id_paciente, 
          nome: patientData.nome, 
          data_nascimento: new Date(patientData.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR'), 
          sexo: patientData.sexo === 'masculino' ? 'Masculino' : 'Feminino' 
        });

        // Carregar medidas do paciente
        const measurementData = await getMeasurementsByPatientId(id, isAdmin, user.id);
        console.log('Medidas carregadas:', measurementData.length);
        
        const classifiedData = (measurementData || [])
          .map(m => ({ ...m, ...calculateIndices(m) }))
          .sort((a, b) => new Date(a.data_medicao).getTime() - new Date(b.data_medicao).getTime());
        
        // Aplicar carry forward nos valores de CI e CVAI
        const dataWithCarryForward = applyMeasurementsCarryForward(classifiedData);
        setMeasurements(dataWithCarryForward);
        setDataLoaded(true);

      } catch (error) {
        console.error('Erro ao carregar dados da página:', error);
        toast.error("Ocorreu um erro ao carregar os dados da página.");
      }
    };

    loadPageData();
  }, [pacienteId, adminLoading, userFilterLoading, user, currentUserId, isAdmin, dataLoaded]);

  // Reset dataLoaded when pacienteId changes
  useEffect(() => {
    setDataLoaded(false);
    setPatientInfo(null);
    setMeasurements([]);
  }, [pacienteId]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const getClassificationColor = (classification: string) => {
    switch (classification.toLowerCase()) {
      case "normal": return "text-green-600 bg-green-50 border-green-200";
      case "leve": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "moderada": case "moderado": return "text-orange-600 bg-orange-50 border-orange-200";
      case "grave": case "severa": case "severo": return "text-red-600 bg-red-50 border-red-200";
      case "dolicocefalia": case "dolicocefalia leve": case "dolicocefalia moderada": return "text-blue-600 bg-blue-50 border-blue-200";
      case "braquicefalia": case "braquicefalia leve": case "braquicefalia moderada": case "braquicefalia severa": return "text-purple-600 bg-purple-50 border-purple-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };
  
  const handleEdit = (m: MeasurementDisplay) => { 
    setEditingId(m.id_medida!); 
    // Formatar a data para o input type="date" (YYYY-MM-DD)
    const formattedData = {
      ...m,
      data_medicao: m.data_medicao ? new Date(m.data_medicao).toISOString().split('T')[0] : ''
    };
    setEditingData(formattedData); 
  };
  
  const handleCancelEdit = () => { 
    setEditingId(null); 
    setEditingData({}); 
    setValidationErrors({});
  };

  const validateField = (field: keyof Measurement, value: string | number | null): string | null => {
    if (field === 'data_medicao') {
      if (!value) return "Data é obrigatória";
      const date = new Date(value);
      if (isNaN(date.getTime())) return "Data inválida";
      if (date > new Date()) return "Data não pode ser futura";
      return null;
    }
    
    if (typeof value === 'number') {
      if (value < 0) return "Valor não pode ser negativo";
      if (value > 1000) return "Valor muito alto";
    }
    
    return null;
  };
  
  const handleInputChange = (field: keyof Measurement, value: string) => {
    let processedValue: string | number | null;
    
    if (field === 'data_medicao') {
      // Para campo de data, manter como string no formato YYYY-MM-DD
      processedValue = value;
    } else {
      // Para campos numéricos, converter para número ou null
      processedValue = value === "" ? null : parseFloat(value);
      
      // Validação básica para campos numéricos
      if (processedValue !== null && (isNaN(processedValue) || processedValue < 0)) {
        setValidationErrors(prev => ({ ...prev, [field]: "Valor inválido" }));
        return; // Não atualizar se valor inválido
      }
    }
    
    // Validar o campo
    const error = validateField(field, processedValue);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
    
    const updated = { ...editingData, [field]: processedValue };
    setEditingData({ ...updated, ...calculateIndices(updated) });
  };

  // Função para filtrar apenas os campos válidos do banco de dados
  const filterDatabaseFields = (data: Partial<MeasurementDisplay>) => {
    const {
      ciClass, cvaiClass, tbcClass, // Remover campos calculados
      ...validFields
    } = data;
    return validFields;
  };

  const handleSaveEdit = async () => {
    if (!editingId || !user) return;
    
    // Verificar se há erros de validação
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Corrija os erros antes de salvar");
      return;
    }
    
    // Validações básicas
    if (!editingData.data_medicao) {
      toast.error("Data da medição é obrigatória");
      return;
    }
    
    // Preparar dados para salvar
    const calculatedData = { ...editingData, ...calculateIndices(editingData) };
    
    // Garantir que a data esteja no formato correto para o banco (ISO string)
    if (calculatedData.data_medicao && typeof calculatedData.data_medicao === 'string') {
      // Se a data está no formato YYYY-MM-DD, converter para ISO string
      if (calculatedData.data_medicao.match(/^\d{4}-\d{2}-\d{2}$/)) {
        calculatedData.data_medicao = new Date(calculatedData.data_medicao + 'T00:00:00.000Z').toISOString();
      }
    }
    
    // Filtrar apenas os campos que existem na tabela do banco
    const filteredData = filterDatabaseFields(calculatedData);
    
    const success = await updateMeasurement(editingId, filteredData, isAdmin, user.id);
    if (success) {
      handleCancelEdit();
      toast.success("Medida atualizada com sucesso!");
      const updatedList = await getMeasurementsByPatientId(parseInt(pacienteId!), isAdmin, user.id);
      const classifiedList = (updatedList || [])
        .map(m => ({...m, ...calculateIndices(m)}))
        .sort((a, b) => new Date(a.data_medicao).getTime() - new Date(b.data_medicao).getTime());
      
      // Aplicar carry forward nos valores de CI e CVAI
      const dataWithCarryForward = applyMeasurementsCarryForward(classifiedList);
      setMeasurements(dataWithCarryForward);
    } else {
      toast.error("Erro ao atualizar medida. Tente novamente.");
    }
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm("Deseja realmente excluir esta medida? Esta ação não pode ser desfeita.") && user) {
      const ok = await deleteMeasurement(id, isAdmin, user.id);
      if (ok) {
        toast.success("Medida excluída com sucesso!");
        setMeasurements(prev => prev.filter(m => m.id_medida !== id));
      }
    }
  };

  // Handler para abrir o modal de seleção de fotos
  const handleExportPdfClick = () => {
    setIsPhotoModalOpen(true);
  };

  // Handler para exportar com fotos selecionadas
  const handleExportWithPhotos = (pairs: PhotoPairForExport[]) => {
    setPhotoPairsForExport(pairs);
    setIsPhotoModalOpen(false);
    // Passar os pares de fotos para o exportToPdf
    exportToPdf(pairs);
  };

  // Handler para exportar sem fotos
  const handleExportWithoutPhotos = () => {
    setPhotoPairsForExport([]);
    setIsPhotoModalOpen(false);
    exportToPdf();
  };

  // Preparar dados do gráfico CI com carry forward
  const chartData = applyCarryForward(
    (measurements || [])
      .sort((a, b) => new Date(a.data_medicao).getTime() - new Date(b.data_medicao).getTime())
      .map(m => ({ data: formatDate(m.data_medicao), CI: m.ci, classification: m.ciClass })),
    'CI'
  );

  // Preparar dados do gráfico CVAI com carry forward
  const cvaiChartData = applyCarryForward(
    (measurements || [])
      .sort((a, b) => new Date(a.data_medicao).getTime() - new Date(b.data_medicao).getTime())
      .map(m => ({ data: formatDate(m.data_medicao), CVAI: m.cvai, classification: m.cvaiClass })),
    'CVAI'
  );
  
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
  const isLoading = adminLoading || patientLoading || measurementsLoading || userFilterLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/home')}>
              <img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" />
              <span className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Simetrik Baby</span>
            </div>
            <UserMenu />
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
              <h1 className="text-3xl font-bold text-gray-900">{patientInfo.nome}</h1>
              <p className="mt-1 text-lg text-gray-600">Evolução das medidas cranianas</p>
            </div>
          ) : !isLoading && !patientInfo ? (<div className="text-lg text-red-500">Paciente não encontrado.</div>) : null}
        </div>

        {!isLoading && measurements.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <Card id="ci-card">
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
                        width={isExportingPdf ? 40 : 0}
                        tick={isExportingPdf}
                        axisLine={isExportingPdf}
                        tickLine={isExportingPdf}
                      />
                      <Tooltip content={<CustomTooltip data={chartData} dataKey="CI" unit="" />} />
                      <ReferenceArea y1={100} y2={110} fill={ciReferenceData[5].hex} fillOpacity={0.3} />
                      <ReferenceArea y1={90}  y2={100} fill={ciReferenceData[4].hex} fillOpacity={0.3} />
                      <ReferenceArea y1={85}  y2={90}  fill={ciReferenceData[3].hex} fillOpacity={0.3} />
                      <ReferenceArea y1={75}  y2={85}  fill={ciReferenceData[2].hex} fillOpacity={0.3} />
                      <ReferenceArea y1={70}  y2={75}  fill={ciReferenceData[1].hex} fillOpacity={0.3} />
                      <ReferenceArea y1={60}  y2={70}  fill={ciReferenceData[0].hex} fillOpacity={0.3} />
                      <Line type="monotone" dataKey="CI" stroke="#1e3a8a" strokeWidth={2} name="Índice Cefálico" dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  {/* Legenda Vertical com CSS */}
                  <div className="absolute top-0 right-0 h-full flex flex-col justify-center items-center pointer-events-none w-8">
                    <div 
                      className="absolute font-bold text-gray-600 text-xs" 
                      style={{ 
                        writingMode: 'vertical-rl', 
                        transform: 'rotate(180deg)', 
                        top: '40px'
                      }} 
                    > 
                      Braquicefalia 
                    </div> 
                    <div 
                      className="absolute font-bold text-gray-600 text-xs" 
                      style={{ 
                        writingMode: 'vertical-rl', 
                        transform: 'rotate(180deg)', 
                        bottom: '35px'
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
            <Card id="cvai-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-600" />Evolução do CVAI (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cvaiChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" fontSize={12} />
                    <YAxis domain={[0, 15]} fontSize={12} width={isExportingPdf ? 40 : 0} tick={isExportingPdf} axisLine={isExportingPdf} tickLine={isExportingPdf}  />
                    <Tooltip content={<CustomTooltip data={cvaiChartData} dataKey="CVAI" unit="%" />} />
                    <ReferenceArea y1={8.75} y2={15} fill={cvaiLegend[3].hex} fillOpacity={0.3} />
                    <ReferenceArea y1={6.25} y2={8.75} fill={cvaiLegend[2].hex} fillOpacity={0.3} />
                    <ReferenceArea y1={3.5} y2={6.25} fill={cvaiLegend[1].hex} fillOpacity={0.3} />
                    <ReferenceArea y1={0} y2={3.5} fill={cvaiLegend[0].hex} fillOpacity={0.3} />
                    <Line type="monotone" dataKey="CVAI" stroke="#1e3a8a" strokeWidth={2} name="CVAI" dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls={false} />
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

        <Card id="measurements-table-section">
          <CardHeader><CardTitle>Histórico de Medidas</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Data</TableHead>
                    <TableHead className="w-14">PC</TableHead>
                    <TableHead className="w-14">AP</TableHead>
                    <TableHead className="w-14">BP</TableHead>
                    <TableHead className="w-14">PD</TableHead>
                    <TableHead className="w-14">PE</TableHead>
                    <TableHead className="w-14">TD</TableHead>
                    <TableHead className="w-14">TE</TableHead>
                    <TableHead className="w-20">CI</TableHead>
                    <TableHead className="w-20">CVAI</TableHead>
                    <TableHead className="w-16">TBC</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={12} className="text-center h-24">Carregando medidas...</TableCell></TableRow>
                  ) : !measurements || measurements.length === 0 ? (
                    <TableRow><TableCell colSpan={12} className="text-center h-24 text-gray-500">Nenhuma medida encontrada para este paciente.</TableCell></TableRow>
                  ) : (
                    measurements.map((m) => (
                      <TableRow key={m.id_medida}>
                        {editingId === m.id_medida ? (
                          <>
                            <TableCell>
                              <div className="space-y-1">
                                <Input 
                                  type="date" 
                                  value={editingData.data_medicao || ""} 
                                  onChange={(e) => handleInputChange("data_medicao", e.target.value)} 
                                  className={`w-36 ${validationErrors.data_medicao ? 'border-red-500 focus:border-red-500' : ''}`}
                                />
                                {validationErrors.data_medicao && (
                                  <p className="text-xs text-red-500">{validationErrors.data_medicao}</p>
                                )}
                              </div>
                            </TableCell>
                            {[ 'pc', 'ap', 'bp', 'pd', 'pe', 'td', 'te'].map(field => (
                              <TableCell key={field}>
                                <div className="space-y-1">
                                  <Input 
                                    type="number" 
                                    step="0.1" 
                                    value={editingData[field as keyof Measurement] || ""} 
                                    onChange={(e) => handleInputChange(field as keyof Measurement, e.target.value)} 
                                    className={`w-20 ${validationErrors[field] ? 'border-red-500 focus:border-red-500' : ''}`}
                                  />
                                  {validationErrors[field] && (
                                    <p className="text-xs text-red-500">{validationErrors[field]}</p>
                                  )}
                                </div>
                              </TableCell>
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

        {/* Botões de Exportação - PDF e Imagens */}
        {!isLoading && measurements.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <Button
              onClick={handleExportPdfClick}
              disabled={isExporting || isExportingImages}
              size="lg"
              className="gap-2"
            >
              <FileDown className="w-5 h-5" />
              {isExporting ? 'Exportando...' : 'Exportar para PDF'}
            </Button>
            <Button
              onClick={exportToImages}
              disabled={isExporting || isExportingImages}
              size="lg"
              className="gap-2"
            >
              <ImageDown className="w-5 h-5" />
              {isExportingImages ? 'Exportando...' : 'Exportar Imagens'}
            </Button>
          </div>
        )}
      </main>

      {/* Modal de Seleção de Fotos Comparativas */}
      <PhotoComparisonModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onExport={handleExportWithPhotos}
        onExportWithoutPhotos={handleExportWithoutPhotos}
        pacienteId={patientInfo?.id_paciente || null}
        isExporting={isExporting}
      />

      <footer className="mt-16 pb-8 text-center text-gray-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8"><p className="mt-2 text-xs">&copy; {new Date().getFullYear()} AM BI Análises Inteligentes. Todos os direitos reservados.</p></div>
      </footer>
    </div>
  );
};

export default PatientEvolution;