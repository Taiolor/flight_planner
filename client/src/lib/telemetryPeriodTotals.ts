export type TelemetryPeriodTotalState = {
  isLoading: boolean;
  isError: boolean;
  total: number;
};

export function getTelemetryPeriodTotalLabel({
  isLoading,
  isError,
  total,
}: TelemetryPeriodTotalState) {
  if (isLoading) return "…";
  if (isError) return "—";

  return new Intl.NumberFormat("pt-BR").format(total);
}
