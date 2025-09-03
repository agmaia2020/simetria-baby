export const getFormattedAge = (birthDateString: string): string => {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  
  // Ajustar se o dia ainda não passou
  if (days < 0) {
    months--;
  }
  
  // Ajustar se o mês ainda não passou
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years > 0) {
    return `${years} ano${years > 1 ? 's' : ''}`;
  }
  
  return `${months} mês${months !== 1 ? 'es' : ''}`;
};