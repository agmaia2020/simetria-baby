/**
 * Hook para exportação de imagens (PNG) da evolução do paciente
 * Exporta os 2 gráficos e a tabela em um arquivo ZIP
 */

import { useState } from 'react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { captureRechartsGraph, captureVisibleElement } from '@/utils/pdfExport';

interface PatientInfo { nome: string }

interface UsePatientImageExportProps {
  patientInfo: PatientInfo | null;
  onExportStart?: () => void;
  onExportEnd?: () => void;
}

export const usePatientImageExport = ({ patientInfo, onExportStart, onExportEnd }: UsePatientImageExportProps) => {
  const [isExportingImages, setIsExportingImages] = useState(false);

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const exportToImages = async () => {
    if (!patientInfo) { toast.error('Informações do paciente não disponíveis'); return; }
    setIsExportingImages(true);
    toast.info('Preparando exportação das imagens...');
    onExportStart?.();
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      const zip = new JSZip();
      const patientName = patientInfo.nome.replace(/\s+/g, '_');
      let capturedCount = 0;
      const ciGraphData = await captureRechartsGraph('ci-card');
      if (ciGraphData) { zip.file(`${patientName}_grafico_CI.png`, dataUrlToBlob(ciGraphData)); capturedCount++; }
      const cvaiGraphData = await captureRechartsGraph('cvai-card');
      if (cvaiGraphData) { zip.file(`${patientName}_grafico_CVAI.png`, dataUrlToBlob(cvaiGraphData)); capturedCount++; }
      const tableSection = document.getElementById('measurements-table-section');
      const hidden: HTMLElement[] = [];
      if (tableSection) {
        const table = tableSection.querySelector('table');
        if (table) {
          table.querySelectorAll('thead th:last-child, tbody td:last-child').forEach(cell => {
            const el = cell as HTMLElement; hidden.push(el); el.style.display = 'none';
          });
        }
      }
      const tableCanvas = await captureVisibleElement('measurements-table-section', { scale: 2 });
      hidden.forEach(el => { el.style.display = ''; });
      if (tableCanvas) { zip.file(`${patientName}_tabela_medidas.png`, dataUrlToBlob(tableCanvas.toDataURL('image/png', 1.0))); capturedCount++; }
      if (capturedCount === 0) { toast.error('Não foi possível capturar nenhum conteúdo'); return; }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${patientName}_imagens.zip`);
      toast.success(`${capturedCount} imagens exportadas com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar imagens:', error);
      toast.error('Erro ao exportar imagens. Por favor, tente novamente.');
    } finally { onExportEnd?.(); setIsExportingImages(false); }
  };

  return { exportToImages, isExportingImages };
};