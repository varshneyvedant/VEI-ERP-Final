import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

/**
 * Convert any value to a JavaScript number for DISPLAY ONLY.
 * Do NOT use the returned number for further financial calculations.
 * For calculations, use toDecimal() and Decimal arithmetic methods.
 */
export function decimalToNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (Decimal.isDecimal(val)) return val.toNumber();
  if (typeof val === 'string') return parseFloat(val) || 0;
  return Number(val) || 0;
}

/**
 * Convert any value to a Prisma Decimal for precise arithmetic.
 * Use this for all financial calculations.
 */
export function toDecimal(val: any): Prisma.Decimal {
  if (val === null || val === undefined) return new Prisma.Decimal(0);
  if (Decimal.isDecimal(val)) return val as Prisma.Decimal;
  if (typeof val === 'number' || typeof val === 'string') return new Prisma.Decimal(val);
  return new Prisma.Decimal(0);
}

/** Add two Decimal values */
export function decimalAdd(a: any, b: any): Prisma.Decimal {
  return toDecimal(a).add(toDecimal(b));
}

/** Subtract b from a */
export function decimalSub(a: any, b: any): Prisma.Decimal {
  return toDecimal(a).sub(toDecimal(b));
}

/** Multiply two Decimal values */
export function decimalMul(a: any, b: any): Prisma.Decimal {
  return toDecimal(a).mul(toDecimal(b));
}

/** Divide a by b. Returns 0 if b is zero (safe division). */
export function decimalDiv(a: any, b: any): Prisma.Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) return new Prisma.Decimal(0);
  return toDecimal(a).div(divisor);
}

/** Check if a Decimal value is greater than zero */
export function isPositive(val: any): boolean {
  return toDecimal(val).greaterThan(0);
}

/** Check if a Decimal value is zero */
export function isZero(val: any): boolean {
  return toDecimal(val).isZero();
}

/** Format a Decimal/number as currency string for display */
export function formatCurrency(val: any, decimals: number = 2): string {
  return decimalToNumber(val).toFixed(decimals);
}
