/**
 * Hook para exportação de PDF da evolução do paciente
 * SOLUÇÃO: Usa html-to-image em vez de html2canvas
 * 
 * IMPORTANTE: Instalar dependência:
 * npm install html-to-image
 */

import { useState } from 'react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import {
  captureRechartsGraph,
  captureVisibleElement,
  addPdfHeader,
  addPdfFooter,
  addSignatureField,
  addProfessionalInfoBelowName,
  addPhotoComparisonSection,
  calculateAge,
  parsePtBrDate,
  fetchFaviconDataUrl,
  assetToDataUrl,
  type PatientPdfData,
  type PhotoPairForPdf,
} from '@/utils/pdfExport';
import novoLogo from '@/assets/Logo Modificado.png';
import { supabase } from '@/integrations/supabase/client';

interface PatientInfo {
  nome: string;
  data_nascimento: string;
  sexo: string;
}

interface Measurement {
  data_medicao: string;
  [key: string]: any;
}

interface UsePatientPdfExportProps {
  patientInfo: PatientInfo | null;
  measurements: Measurement[];
  userName: string;
  onExportStart?: () => void;
  onExportEnd?: () => void;
}

export const usePatientPdfExport = ({
  patientInfo,
  measurements,
  userName,
  onExportStart,
  onExportEnd,
}: UsePatientPdfExportProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = async (photoPairs?: PhotoPairForPdf[]) => {
    if (!patientInfo) {
      toast.error('Informações do paciente não disponíveis');
      return;
    }

    setIsExporting(true);
    toast.info('Preparando exportação do PDF...');

    // Notificar início da exportação (para componentes ajustarem UI - mostrar eixo Y)
    onExportStart?.();

    // Aguardar re-renderização do React e do Recharts
    // O Recharts precisa de tempo para re-renderizar o gráfico com o eixo Y visível
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      console.log('🚀 Iniciando exportação de PDF...');
      if (photoPairs && photoPairs.length > 0) {
        console.log(`📷 Incluindo ${photoPairs.length} par(es) de fotos`);
      }

      // Capturar gráfico CI
      console.log('📊 Capturando gráfico CI...');
      const ciGraphData = await captureRechartsGraph('ci-card');
      
      if (ciGraphData) {
        console.log('✅ Gráfico CI capturado');
      } else {
        console.warn('⚠️ Falha ao capturar gráfico CI');
      }

      // Capturar gráfico CVAI
      console.log('📊 Capturando gráfico CVAI...');
      const cvaiGraphData = await captureRechartsGraph('cvai-card');
      
      if (cvaiGraphData) {
        console.log('✅ Gráfico CVAI capturado');
      } else {
        console.warn('⚠️ Falha ao capturar gráfico CVAI');
      }

      // Capturar tabela
      console.log('📋 Capturando tabela...');
      
      // Esconder a coluna "Ações" antes de capturar
      const tableSection = document.getElementById('measurements-table-section');
      const hiddenElements: HTMLElement[] = [];
      
      if (tableSection) {
        const table = tableSection.querySelector('table');
        if (table) {
          // Esconder o cabeçalho da coluna Ações
          const headerCells = table.querySelectorAll('thead th:last-child');
          headerCells.forEach((cell) => {
            const el = cell as HTMLElement;
            hiddenElements.push(el);
            el.style.display = 'none';
          });
          
          // Esconder todas as células da coluna Ações no corpo da tabela
          const bodyCells = table.querySelectorAll('tbody td:last-child');
          bodyCells.forEach((cell) => {
            const el = cell as HTMLElement;
            hiddenElements.push(el);
            el.style.display = 'none';
          });
        }
      }
      
      const tableCanvas = await captureVisibleElement('measurements-table-section', {
        scale: 2,
      });
      const tableData = tableCanvas?.toDataURL('image/png', 1.0);
      
      // Restaurar a visibilidade da coluna "Ações"
      hiddenElements.forEach((el) => {
        el.style.display = '';
      });
      
      if (tableData) {
        console.log('✅ Tabela capturada');
      } else {
        console.warn('⚠️ Falha ao capturar tabela');
      }

      // Verificar se conseguiu capturar ao menos algo
      if (!ciGraphData && !cvaiGraphData && !tableData) {
        toast.error('Não foi possível capturar nenhum conteúdo para o PDF');
        setIsExporting(false);
        return;
      }

      // Criar PDF
      console.log('📄 Criando PDF...');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;

      // Preparar dados do paciente
      const birthDate = parsePtBrDate(patientInfo.data_nascimento);
      const idade = birthDate ? calculateAge(birthDate) : 'N/A';
      const dataCadastro =
        measurements.length > 0
          ? new Date(measurements[0].data_medicao).toLocaleDateString('pt-BR')
          : 'N/A';

      const pdfData: PatientPdfData = {
        nome: patientInfo.nome,
        dataNascimento: patientInfo.data_nascimento,
        idade,
        sexo: patientInfo.sexo,
        dataCadastro,
        profissional: userName || 'N/A',
      };

      // Calcular total de páginas (será atualizado no final)
      let totalPages = 0;
      if (ciGraphData) totalPages++;
      if (cvaiGraphData) totalPages++;
      if (tableData) totalPages++;
      if (photoPairs && photoPairs.length > 0) {
        // Estimar páginas de fotos (2 pares por página aproximadamente)
        totalPages += Math.ceil(photoPairs.length / 2);
      }

      let currentPage = 1;
      let isFirstPage = true;
      const iconDataUrl = (await assetToDataUrl(novoLogo, 32)) || (await fetchFaviconDataUrl(32));

      // Ler dados do profissional para exibir no PDF
      let profissionalEspecialidade: string | undefined;
      let profissionalCrefito: string | undefined;
      try {
        const { data: authUser } = await supabase.auth.getUser();
        const uid = authUser?.user?.id;
        if (uid) {
          const { data: prof } = await supabase
            .from('usuarios')
            .select('especialidade, crefito_number')
            .eq('id', uid)
            .maybeSingle();
          profissionalEspecialidade = (prof as any)?.especialidade || authUser?.user?.user_metadata?.especialidade;
          profissionalCrefito = (prof as any)?.crefito_number || authUser?.user?.user_metadata?.crefito_number;
        }
      } catch {}

      const profissionalInfo = { especialidade: profissionalEspecialidade, crefito: profissionalCrefito };

      // Função auxiliar para adicionar imagem ao PDF (SEM assinatura)
      const addImageToPdf = async (
        imageData: string,
        title: string
      ) => {
        if (!isFirstPage) {
          pdf.addPage();
        }

        const headerHeight = addPdfHeader(
          pdf,
          pdfData,
          10,
          iconDataUrl || undefined,
          6,
          5,
          profissionalInfo
        );

        // Título do gráfico
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text(title, 105, headerHeight + 5, { align: 'center' });

        // Carregar imagem para obter dimensões
        const img = new Image();
        img.src = imageData;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Calcular dimensões proporcionais
        const maxWidth = 190;
        const maxHeight = 180;
        let imgWidth = maxWidth;
        let imgHeight = (img.height / img.width) * maxWidth;

        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = (img.width / img.height) * maxHeight;
        }

        const xPos = (pageWidth - imgWidth) / 2;
        const yPos = headerHeight + 15;

        pdf.addImage(imageData, 'PNG', xPos, yPos, imgWidth, imgHeight, undefined, 'SLOW');
        addPdfFooter(pdf, currentPage, totalPages, pdfData.profissional);
        
        currentPage++;
        isFirstPage = false;
      };

      // Adicionar gráfico CI
      if (ciGraphData) {
        await addImageToPdf(ciGraphData, 'Evolução do Índice Cefálico (CI)');
      }

      // Adicionar gráfico CVAI
      if (cvaiGraphData) {
        await addImageToPdf(cvaiGraphData, 'Evolução do CVAI (%)');
      }

      // Adicionar tabela (SEM assinatura - será adicionada no final)
      if (tableData && tableCanvas) {
        if (!isFirstPage) {
          pdf.addPage();
        }

        const headerHeight = addPdfHeader(
          pdf,
          pdfData,
          10,
          iconDataUrl || undefined,
          6,
          5,
          profissionalInfo
        );

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('Histórico de Medidas', 105, headerHeight + 5, { align: 'center' });

        const maxTableWidth = 190;
        const tableRatio = tableCanvas.height / tableCanvas.width;
        let tableWidth = maxTableWidth;
        let tableHeight = tableWidth * tableRatio;

        // Calcular altura disponível (sem assinatura nesta página se houver fotos)
        const contentTopY = headerHeight + 15;
        const availableHeight = pageHeight - contentTopY - 30; // Margem inferior

        // Ajustar se muito grande
        if (tableHeight > availableHeight) {
          tableHeight = availableHeight;
          tableWidth = tableHeight / tableRatio;
        }

        const xPos = (pageWidth - tableWidth) / 2;
        const yPos = contentTopY;

        pdf.addImage(tableData, 'PNG', xPos, yPos, tableWidth, tableHeight);
        addPdfFooter(pdf, currentPage, totalPages, pdfData.profissional);
        
        currentPage++;
        isFirstPage = false;
      }

      // Adicionar seção de fotos comparativas (se houver)
      if (photoPairs && photoPairs.length > 0) {
        console.log('📷 Adicionando fotos comparativas ao PDF...');
        await addPhotoComparisonSection(
          pdf,
          photoPairs,
          50, // headerHeight
          pdfData,
          iconDataUrl || undefined,
          profissionalInfo
        );
        console.log('✅ Fotos adicionadas');
      }

      // Adicionar página final com assinatura
      pdf.addPage();
      const finalHeaderHeight = addPdfHeader(
        pdf,
        pdfData,
        10,
        iconDataUrl || undefined,
        6,
        5,
        profissionalInfo
      );

      // Posicionar assinatura no centro da página
      const usefulWidthMm = pageWidth - 20;
      const lineLengthMm = Math.round(usefulWidthMm * 0.55);
      const signatureX = (pageWidth - lineLengthMm) / 2;
      const signatureY = pageHeight * 0.5; // Meio da página

      addSignatureField(pdf, signatureX, signatureY, pdfData.profissional, lineLengthMm, 1, 4);
      const centerX = signatureX + lineLengthMm / 2;
      const baseY = signatureY + 4;
      addProfessionalInfoBelowName(
        pdf,
        centerX,
        baseY,
        profissionalInfo,
        5
      );

      // Atualizar total de páginas e adicionar rodapé na última página
      totalPages = pdf.getNumberOfPages();
      addPdfFooter(pdf, totalPages, totalPages, pdfData.profissional);

      // Atualizar rodapés de todas as páginas com o total correto
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        // Limpar área do rodapé
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        // Adicionar rodapé atualizado
        addPdfFooter(pdf, i, totalPages, pdfData.profissional);
      }

      // Salvar PDF
      const filename = `evolucao_${patientInfo.nome.replace(/\s+/g, '_')}.pdf`;
      console.log(`💾 Salvando PDF: ${filename}`);

      // Tentar File System Access API
      const anyWindow = window as any;
      if (anyWindow.showSaveFilePicker) {
        try {
          const handle = await anyWindow.showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: 'PDF Document',
                accept: { 'application/pdf': ['.pdf'] },
              },
            ],
          });

          const writable = await handle.createWritable();
          const blob = pdf.output('blob');
          await writable.write(blob);
          await writable.close();

          console.log('✅ PDF salvo com File System Access API');
          toast.success('PDF exportado com sucesso!');
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('Erro File System Access:', err);
            pdf.save(filename);
            toast.success('PDF exportado com sucesso!');
          }
        }
      } else {
        pdf.save(filename);
        console.log('✅ PDF salvo com download tradicional');
        toast.success('PDF exportado com sucesso!');
      }
    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF. Por favor, tente novamente.');
    } finally {
      // Notificar fim da exportação (para componentes restaurarem UI - ocultar eixo Y)
      onExportEnd?.();
      setIsExporting(false);
    }
  };

  return {
    exportToPdf,
    isExporting,
  };
};