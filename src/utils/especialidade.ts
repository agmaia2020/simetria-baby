/**
 * Utilitários para validação e formatação de Especialidade
 * CORRIGIDO: Permite espaços durante a digitação
 */

/**
 * Normaliza o valor removendo espaços extras
 * Usado apenas ao SALVAR, não durante a digitação
 */
export const normalizeEspecialidade = (value: string) => {
  const v = value.replace(/\s+/g, ' ').trim();
  return v;
};

/**
 * Valida o valor da especialidade
 * CORRIGIDO: Não faz trim() durante digitação para permitir espaços
 */
export const validateEspecialidade = (value: string, isFinalValidation: boolean = false) => {
  // Durante digitação: apenas remove espaços duplos, mas mantém espaço no final
  // Na validação final (ao salvar): faz trim completo
  const v = isFinalValidation 
    ? value.replace(/\s+/g, ' ').trim() 
    : value.replace(/\s{2,}/g, ' '); // Só remove espaços duplos, mantém espaço simples no final
  
  const errors: string[] = [];
  
  // Para validação em tempo real, usamos o valor com trim para checar
  const trimmedValue = v.trim();
  
  // Só valida se tiver conteúdo (permite campo vazio durante digitação)
  if (isFinalValidation && !trimmedValue) {
    errors.push('Informe sua especialidade');
  }
  
  // Regex que permite letras (incluindo acentuadas), espaços, hífen e apóstrofo
  const pattern = /^[A-Za-zÀ-ÖØ-öø-ÿ\-' ]*$/;
  
  if (v && !pattern.test(v)) {
    errors.push('Use apenas letras, espaços e hífen');
  }
  
  if (trimmedValue && trimmedValue.length < 4) {
    errors.push('Mínimo de 4 caracteres');
  }
  
  if (trimmedValue.length > 64) {
    errors.push('Máximo de 64 caracteres');
  }
  
  return { valid: errors.length === 0, errors, value: v };
};

/**
 * Verifica se o valor é válido (validação final)
 */
export const isValidEspecialidade = (value: string) => 
  validateEspecialidade(value, true).valid;

/**
 * Capitaliza a primeira letra de uma string
 */
const capitalize = (s: string) => 
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/**
 * Aplica title case em uma palavra, respeitando hífens e apóstrofos
 */
const titleCaseWord = (word: string) => {
  const partsHyphen = word.split('-');
  const capHyphen = partsHyphen.map(part => {
    const partsApos = part.split("'");
    return partsApos.map(p => capitalize(p)).join("'");
  }).join('-');
  return capHyphen;
};

/**
 * Formata a especialidade em Title Case
 */
export const formatEspecialidade = (value: string) => {
  const v = normalizeEspecialidade(value);
  if (!v) return '';
  return v.split(' ').map(w => titleCaseWord(w)).join(' ');
};