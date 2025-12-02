/**
 * Utilidades para exportação de PDF com gráficos Recharts
 * SOLUÇÃO: Usa html-to-image em vez de html2canvas
 * html-to-image é mais confiável para captura de SVGs (como os do Recharts)
 * 
 * IMPORTANTE: Instalar dependência:
 * npm install html-to-image
 */

import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

interface CaptureOptions {
  quality?: number;
  backgroundColor?: string;
  pixelRatio?: number;
}

/**
 * Captura um elemento como PNG usando html-to-image
 * Esta biblioteca é mais confiável que html2canvas para SVGs
 */
export const captureElementToPng = async (
  elementId: string,
  options: CaptureOptions = {}
): Promise<string | null> => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Elemento ${elementId} não encontrado`);
    return null;
  }

  // Aguardar renderização completa
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const dataUrl = await htmlToImage.toPng(element, {
      quality: options.quality || 1.0,
      backgroundColor: options.backgroundColor || '#ffffff',
      pixelRatio: options.pixelRatio || 2,
      // Filtro para ignorar elementos problemáticos
      filter: (node) => {
        // Ignorar elementos de script e style
        if (node.tagName === 'SCRIPT' || node.tagName === 'NOSCRIPT') {
          return false;
        }
        return true;
      },
    });

    console.log(`✅ Elemento ${elementId} capturado com sucesso`);
    return dataUrl;
  } catch (error) {
    console.error(`Erro ao capturar elemento ${elementId}:`, error);
    
    // Fallback: tentar com toSvg e depois converter
    try {
      console.log(`Tentando fallback com toSvg para ${elementId}...`);
      const svgDataUrl = await htmlToImage.toSvg(element, {
        backgroundColor: options.backgroundColor || '#ffffff',
      });
      
      // Converter SVG para PNG via canvas
      return await svgToPng(svgDataUrl, element.offsetWidth, element.offsetHeight, options.pixelRatio || 2);
    } catch (fallbackError) {
      console.error(`Fallback também falhou para ${elementId}:`, fallbackError);
      return null;
    }
  }
};

/**
 * Converte SVG Data URL para PNG Data URL
 */
const svgToPng = (svgDataUrl: string, width: number, height: number, pixelRatio: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Não foi possível criar contexto 2D'));
        return;
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(pixelRatio, pixelRatio);
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.onerror = () => reject(new Error('Erro ao carregar SVG'));
    img.src = svgDataUrl;
  });
};

/**
 * Captura gráficos Recharts (card completo incluindo legendas)
 */
export const captureRechartsGraph = async (
  cardElementId: string
): Promise<string | null> => {
  console.log(`📊 Capturando gráfico: ${cardElementId}`);
  return captureElementToPng(cardElementId, {
    quality: 1.0,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });
};

/**
 * Captura elemento visível (compatibilidade com código anterior)
 */
export const captureVisibleElement = async (
  elementId: string,
  options: { scale?: number; backgroundColor?: string } = {}
): Promise<HTMLCanvasElement | null> => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Elemento ${elementId} não encontrado`);
    return null;
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const dataUrl = await htmlToImage.toPng(element, {
      quality: 1.0,
      backgroundColor: options.backgroundColor || '#ffffff',
      pixelRatio: options.scale || 2,
    });

    // Converter dataUrl para canvas
    return await dataUrlToCanvas(dataUrl);
  } catch (error) {
    console.error(`Erro ao capturar elemento ${elementId}:`, error);
    return null;
  }
};

/**
 * Converte Data URL para Canvas
 */
const dataUrlToCanvas = (dataUrl: string): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Não foi possível criar contexto 2D'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = dataUrl;
  });
};

/**
 * Interface para dados do paciente
 */
export interface PatientPdfData {
  nome: string;
  dataNascimento: string;
  idade: string;
  sexo: string;
  dataCadastro: string;
  profissional: string;
}

/**
 * Adiciona cabeçalho ao PDF
 */
export const addPdfHeader = (
  pdf: jsPDF,
  patientData: PatientPdfData,
  leftMargin: number = 10,
  iconDataUrl?: string,
  iconSizeMm: number = 6,
  iconSpacingMm: number = 5
) => {
  const pageWidth = 210;

  // Título
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  let titleX = leftMargin;
  if (iconDataUrl) {
    const iconY = 7;
    pdf.addImage(iconDataUrl, 'PNG', leftMargin, iconY, iconSizeMm, iconSizeMm);
    titleX = leftMargin + iconSizeMm + iconSpacingMm;
  }
  pdf.text('Relatório de Evolução do Paciente', titleX, 12);

  // Linha separadora
  pdf.setDrawColor(200);
  pdf.setLineWidth(0.3);
  pdf.line(leftMargin, 18, pageWidth - leftMargin, 18);

  // Informações do paciente
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  let yPos = 26;
  const lineHeight = 6;

  // Coluna esquerda
  pdf.setFont('helvetica', 'bold');
  pdf.text('Nome:', leftMargin, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(patientData.nome, leftMargin + 25, yPos);

  yPos += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Idade:', leftMargin, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(patientData.idade, leftMargin + 25, yPos);

  yPos += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Sexo:', leftMargin, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(patientData.sexo, leftMargin + 25, yPos);

  // Coluna direita
  const rightColX = 110;
  yPos = 26;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Nascimento:', rightColX, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(patientData.dataNascimento, rightColX + 30, yPos);

  yPos += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Data Cadastro:', rightColX, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(patientData.dataCadastro, rightColX + 30, yPos);

  yPos += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Profissional:', rightColX, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(patientData.profissional, rightColX + 30, yPos);

  return 50;
};

/**
 * Adiciona rodapé ao PDF
 */
export const addPdfFooter = (
  pdf: jsPDF,
  pageNumber: number,
  totalPages: number,
  profissional: string
) => {
  const pageHeight = 297;
  const pageWidth = 210;
  const footerY = pageHeight - 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);

  const leftText = `Simetrik Baby • ${new Date().toLocaleDateString('pt-BR')} • ${profissional}`;
  pdf.text(leftText, 10, footerY);

  const rightText = `Página ${pageNumber} de ${totalPages}`;
  pdf.text(rightText, pageWidth - 10, footerY, { align: 'right' });

  pdf.setTextColor(0, 0, 0);
};

export const addSignatureField = (
  pdf: jsPDF,
  x: number,
  y: number,
  name: string,
  lengthMm: number = 80,
  thicknessPt: number = 1,
  spacingTextMm: number = 4,
  signatureDataUrl?: string,
  drawDebug?: boolean
) => {
  const thicknessMm = thicknessPt * 0.3528;
  pdf.setDrawColor(0);
  pdf.setLineWidth(thicknessMm);
  pdf.line(x, y, x + lengthMm, y);
  if (drawDebug) {
    pdf.setDrawColor(128);
    pdf.setLineWidth(0.2);
    const midX = x + lengthMm / 2;
    pdf.line(midX, y - 2, midX, y + 2);
    pdf.line(x, y - 2, x, y + 2);
    pdf.line(x + lengthMm, y - 2, x + lengthMm, y + 2);
    pdf.setDrawColor(0);
    pdf.setLineWidth(thicknessMm);
  }
  if (signatureDataUrl) {
    const sigHeight = 12;
    const sigWidth = 40;
    pdf.addImage(signatureDataUrl, 'PNG', x, y - sigHeight - 3, sigWidth, sigHeight);
  }
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  let fontSize = 10;
  pdf.setFontSize(fontSize);
  const maxTextWidth = lengthMm - 4; // margem interna
  // Reduzir fonte automaticamente se o nome exceder a largura da linha
  let textWidth = pdf.getTextWidth(name);
  while (textWidth > maxTextWidth && fontSize > 7) {
    fontSize -= 1;
    pdf.setFontSize(fontSize);
    textWidth = pdf.getTextWidth(name);
  }
  const centerX = x + lengthMm / 2;
  const textY = y + spacingTextMm;
  pdf.text(name, centerX, textY, { align: 'center' });
};

export const addProfessionalInfoBelowName = (
  pdf: jsPDF,
  centerX: number,
  baseY: number,
  opts: { especialidade?: string; crefito?: string },
  spacingMm: number = 5
) => {
  const startY = baseY + spacingMm;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  if (opts.especialidade) {
    pdf.text(opts.especialidade, centerX, startY, { align: 'center' });
  }
  if (opts.crefito) {
    const crefLine = `Crefito Nº ${opts.crefito}`;
    const y2 = startY + spacingMm;
    pdf.text(crefLine, centerX, y2, { align: 'center' });
  }
};
/**
 * Calcula idade a partir de data de nascimento
 */
export const calculateAge = (birthDate: Date): string => {
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} anos e ${months} meses`;
};

/**
 * Parse data no formato pt-BR (dd/mm/yyyy)
 */
export const parsePtBrDate = (dateString: string): Date | null => {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;

  return new Date(year, month - 1, day);
};

/**
 * Obtém o favicon do site e converte para DataURL PNG com o tamanho preferido
 */
export const fetchFaviconDataUrl = async (preferredSize: number = 32): Promise<string | null> => {
  const tryLoad = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  try {
    let img: HTMLImageElement | null = null;
    try {
      img = await tryLoad('/favicon.ico');
    } catch {
      try {
        img = await tryLoad('/favicon.png');
      } catch {
        try {
          img = await tryLoad('/logo.png');
        } catch {
          img = null;
        }
      }
    }
    if (!img) return null;
    const canvas = document.createElement('canvas');
    canvas.width = preferredSize;
    canvas.height = preferredSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
};

/**
 * Converte um asset (URL) em DataURL PNG com redimensionamento
 */
export const assetToDataUrl = async (src: string, preferredSize: number = 32): Promise<string | null> => {
  const img = new Image();
  return new Promise((resolve) => {
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = preferredSize;
      canvas.height = preferredSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
};