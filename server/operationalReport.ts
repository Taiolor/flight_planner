type OperationalReportOverview = {
  totals: {
    pendingPurchases: number;
    incompleteChecklistItems: number;
    activeCreditsCents: number;
  };
  decisions: Array<{ title: string; description: string; severity: string }>;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function buildOperationalExecutiveReportEmail(year: number, overview: OperationalReportOverview) {
  const decisions = overview.decisions.slice(0, 8);
  const rows = decisions.length
    ? decisions.map(decision => `<tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0"><strong>${escapeHtml(decision.title)}</strong><br/><span style="color:#475569">${escapeHtml(decision.description)}</span></td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;color:#17427e;font-weight:700">${escapeHtml(decision.severity)}</td></tr>`).join("")
    : `<tr><td colspan="2" style="padding:12px 0;color:#475569">Não há decisões prioritárias no momento.</td></tr>`;

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:680px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#071a36,#17427e);padding:24px;border-radius:16px 16px 0 0;color:#fff">
        <p style="margin:0;font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.8">Viagens</p>
        <h1 style="margin:8px 0 0;font-size:24px">Relatório executivo · ${year}</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 16px 16px">
        <p style="margin-top:0;color:#475569">Resumo operacional do planejamento, preparado a partir dos dados atuais de viagens, checklist e créditos.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0"><tbody>
          <tr><td style="padding:10px;background:#fff7ed">Compras pendentes</td><td style="padding:10px;background:#fff7ed;text-align:right;font-weight:700">${overview.totals.pendingPurchases}</td></tr>
          <tr><td style="padding:10px;background:#eff6ff">Checklist pendente</td><td style="padding:10px;background:#eff6ff;text-align:right;font-weight:700">${overview.totals.incompleteChecklistItems}</td></tr>
          <tr><td style="padding:10px;background:#ecfdf5">Créditos ativos</td><td style="padding:10px;background:#ecfdf5;text-align:right;font-weight:700">${formatCurrency(overview.totals.activeCreditsCents)}</td></tr>
        </tbody></table>
        <h2 style="font-size:18px;margin:24px 0 8px">Decisões prioritárias</h2>
        <table style="width:100%;border-collapse:collapse"><tbody>${rows}</tbody></table>
        <p style="margin:24px 0 0;font-size:12px;color:#64748b">Este relatório não altera bilhetes, créditos ou configurações. Acesse o Controle operacional para tomar ações.</p>
      </div>
    </div>`;
}
