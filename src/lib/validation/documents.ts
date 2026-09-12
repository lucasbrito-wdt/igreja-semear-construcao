/**
 * Validacao e formatacao de CPF/CNPJ (algoritmo de digito verificador padrao).
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(cpf: string): boolean {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const nums = digits.split("").map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += nums[i] * (10 - i);
  let dv1 = (sum * 10) % 11;
  if (dv1 === 10) dv1 = 0;
  if (dv1 !== nums[9]) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += nums[i] * (11 - i);
  let dv2 = (sum * 10) % 11;
  if (dv2 === 10) dv2 = 0;
  return dv2 === nums[10];
}

export function isValidCnpj(cnpj: string): boolean {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const nums = digits.split("").map(Number);
  const calcDv = (base: number[], weights: number[]): number => {
    const sum = base.reduce((acc, n, i) => acc + n * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const dv1 = calcDv(nums.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (dv1 !== nums[12]) return false;

  const dv2 = calcDv(nums.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return dv2 === nums[13];
}

export function isValidCpfCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}

const CPF_MASK = { groupSizes: [3, 3, 3, 2], separators: [".", ".", "-"] };
const CNPJ_MASK = { groupSizes: [2, 3, 3, 4, 2], separators: [".", ".", "/", "-"] };

function applyProgressiveMask(digits: string, groupSizes: number[], separators: string[]): string {
  let result = "";
  let idx = 0;
  for (let i = 0; i < groupSizes.length; i++) {
    const chunk = digits.slice(idx, idx + groupSizes[i]);
    if (chunk.length === 0) break;
    result += chunk;
    idx += groupSizes[i];
    if (idx < digits.length && separators[i]) result += separators[i];
  }
  return result;
}

export function formatCpfCnpj(value: string): string {
  const digits = onlyDigits(value);
  const mask = digits.length > 11 ? CNPJ_MASK : CPF_MASK;
  return applyProgressiveMask(digits, mask.groupSizes, mask.separators);
}
