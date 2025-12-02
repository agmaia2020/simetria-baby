export const normalizeCrefito = (value: string) => value.replace(/[^A-Za-z0-9]/g, "");

export const validateCrefito = (value: string) => {
  const v = normalizeCrefito(value);
  const errors: string[] = [];
  if (!v) errors.push("Informe o Crefito Nº");
  if (v.length < 5 || v.length > 12) errors.push("Entre 5 e 12 caracteres");
  if (!/^[A-Za-z0-9]+$/.test(v)) errors.push("Apenas letras e números");
  return { valid: errors.length === 0, errors, value: v };
};

export const isValidCrefito = (value: string) => validateCrefito(value).valid;