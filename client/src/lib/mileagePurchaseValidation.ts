export type MileagePurchaseDraft = {
  purchaseDate: string;
  miles: string;
  program: string;
  paidValue: string;
};

export function parseMileagePurchasePriceToCents(value: string): number | null {
  const parsed = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export function validateMileagePurchaseDraft(
  draft: MileagePurchaseDraft,
  year: number
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.purchaseDate)) {
    return "Informe a data da compra.";
  }
  if (!draft.purchaseDate.startsWith(`${year}-`)) {
    return `A data deve pertencer ao exercício ${year}.`;
  }
  const miles = Number(draft.miles);
  if (!Number.isInteger(miles) || miles < 1) {
    return "Informe uma quantidade de milhas maior que zero.";
  }
  if (!draft.program.trim()) {
    return "Informe o programa ou a companhia aérea.";
  }
  if (parseMileagePurchasePriceToCents(draft.paidValue) === null) {
    return "Informe um valor pago válido.";
  }
  return null;
}
