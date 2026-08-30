import { Prisma } from '@prisma/client';

export interface JournalLineInput {
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  debit: number;
  credit: number;
}

export interface JournalEntryInput {
  description: string;
  referenceType?: 'SALE' | 'PURCHASE' | 'PAYMENT' | 'EXPENSE' | 'ADVANCE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'SCRAP_SALE' | 'PRODUCTION';
  referenceId?: string;
  date?: Date;
  lines: JournalLineInput[];
}

/**
 * Centrally records a balanced Double-Entry Journal Entry inside a Prisma Transaction.
 * Uses Prisma Decimal for precise financial arithmetic.
 * Strictly asserts that Total Debits exactly equal Total Credits (within rounding to 2 decimal places).
 */
export async function postJournalEntry(
  tx: Prisma.TransactionClient,
  entry: JournalEntryInput
) {
  const { description, referenceType, referenceId, date, lines } = entry;

  if (lines.length === 0) {
    throw new Error('Journal entry must have at least one transaction line item.');
  }

  // 1. Round each line to 2 decimal places FIRST, then check balance
  const roundedLines = lines.map((line) => ({
    ...line,
    debit: new Prisma.Decimal(line.debit).toDecimalPlaces(2),
    credit: new Prisma.Decimal(line.credit).toDecimalPlaces(2),
  }));

  // Calculate totals using Decimal arithmetic to avoid IEEE-754 rounding
  let totalDebits = new Prisma.Decimal(0);
  let totalCredits = new Prisma.Decimal(0);
  for (const line of roundedLines) {
    totalDebits = totalDebits.add(line.debit);
    totalCredits = totalCredits.add(line.credit);
  }

  // Strict balance check — debits must exactly equal credits after rounding
  if (!totalDebits.equals(totalCredits)) {
    throw new Error(
      `Double-Entry Bookkeeping Mismatch: Total Debits (₹${totalDebits.toFixed(
        2
      )}) must strictly equal Total Credits (₹${totalCredits.toFixed(2)}) for "${description}".`
    );
  }

  // 2. Insert the Journal Entry with precise Decimal values
  const journalEntry = await tx.journalEntry.create({
    data: {
      date: date || new Date(),
      description,
      referenceType,
      referenceId,
      lines: {
        create: roundedLines.map((line) => ({
          accountName: line.accountName,
          accountType: line.accountType,
          debit: line.debit,
          credit: line.credit,
        })),
      },
    },
  });

  return journalEntry;
}
