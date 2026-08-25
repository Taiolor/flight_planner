export type NotificationHistoryCsvRow = {
  sentAt: Date | string;
  status: string;
  isTest: boolean | number;
  weekNumber: number;
  direction: string;
  avisoLabel: string;
  airline: string | null;
  flightNumber: string | null;
  devicesReached: number;
  totalDevices: number;
  errorMessage: string | null;
};

const statusLabels = {
  success: "Sucesso",
  partial: "Parcial",
  failed: "Falha",
} as const;

function getStatusLabel(status: string) {
  return statusLabels[status as keyof typeof statusLabels] ?? status;
}

function escapeCsvValue(value: string | number) {
  const text = String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function formatCsvDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function buildNotificationHistoryCsv(rows: NotificationHistoryCsvRow[]) {
  const header = [
    "Enviado em",
    "Status",
    "Tipo",
    "Semana",
    "Trecho",
    "Aviso",
    "Companhia",
    "Voo",
    "Dispositivos alcançados",
    "Dispositivos totais",
    "Detalhe de erro",
  ];
  const records = rows.map(row => [
    formatCsvDate(row.sentAt),
    getStatusLabel(row.status),
    row.isTest ? "Teste manual" : "Automático",
    row.weekNumber,
    row.direction === "ida" ? "Ida" : "Volta",
    row.avisoLabel,
    row.airline ?? "",
    row.flightNumber ?? "",
    row.devicesReached,
    row.totalDevices,
    row.errorMessage ?? "",
  ]);

  return `\ufeff${[header, ...records]
    .map(record => record.map(escapeCsvValue).join(";"))
    .join("\r\n")}`;
}

export function downloadNotificationHistoryCsv(rows: NotificationHistoryCsvRow[], year: number) {
  const blob = new Blob([buildNotificationHistoryCsv(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `historico-notificacoes-${year}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
