import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useYear } from "@/contexts/YearContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoginModal } from "@/components/auth/LoginModal";
import { LoginRequiredScreen } from "@/components/auth/LoginRequiredMessageBox";
import { GlobalYearSelector } from "@/components/GlobalYearSelector";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { TooltipLabel } from "@/components/ui/tooltip-label";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Landmark,
  Loader2,
  Plane,
  Plus,
  ShieldAlert,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";

type TabId = "decisions" | "prepare" | "credits" | "reports";
type Feedback = { kind: "success" | "error" | "info"; message: string } | null;

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "decisions", label: "Decisões" },
  { id: "prepare", label: "Preparação" },
  { id: "credits", label: "Créditos" },
  { id: "reports", label: "Relatórios" },
];

const checklistCategories = [
  ["checkin", "Check-in"],
  ["documentos", "Documentos"],
  ["bagagem", "Bagagem"],
  ["assento", "Assento"],
  ["traslado", "Traslado"],
  ["hospedagem", "Hospedagem"],
  ["outro", "Outro"],
] as const;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

function StatusPill({ severity }: { severity: "critical" | "warning" | "info" }) {
  const labels = { critical: "Prioridade crítica", warning: "Atenção", info: "Planejamento" };
  const classes = {
    critical: "bg-rose-50 text-rose-700 ring-rose-200",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
    info: "bg-sky-50 text-sky-800 ring-sky-200",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classes[severity]}`}>{labels[severity]}</span>;
}

export default function OperationalControl() {
  const authQuery = trpc.flightAuth.check.useQuery(undefined, { retry: false });
  const [loginOpen, setLoginOpen] = useState(false);

  if (authQuery.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-950"><Loader2 className="h-9 w-9 animate-spin text-sky-300" /></div>;
  }
  if (!authQuery.data?.authenticated) {
    return (
      <main className="min-h-screen bg-slate-950">
        <LoginRequiredScreen
          icon={ShieldAlert}
          title="Controle operacional protegido"
          description="Entre com a sessão interna para acompanhar pendências, créditos, documentos e decisões das viagens."
          loginLabel="Entrar para ver o controle"
          onLogin={() => setLoginOpen(true)}
          resource="financial"
        >
          <Link href="/"><Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Voltar ao planejamento</Button></Link>
        </LoginRequiredScreen>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </main>
    );
  }
  return <OperationalControlContent />;
}

function OperationalControlContent() {
  const { selectedYear } = useYear();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<TabId>("decisions");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [checklistLabel, setChecklistLabel] = useState("");
  const [checklistCategory, setChecklistCategory] = useState<(typeof checklistCategories)[number][0]>("outro");
  const [checklistDueAt, setChecklistDueAt] = useState("");
  const [creditFormOpen, setCreditFormOpen] = useState(false);
  const [creditForm, setCreditForm] = useState({ airline: "", creditType: "credito" as "credito" | "voucher" | "reembolso", value: "", expiresAt: "", code: "", notes: "" });
  const [reportCron, setReportCron] = useState("0 0 12 1 * *");
  const attachmentInput = useRef<HTMLInputElement>(null);

  const overviewQuery = trpc.operational.getOverview.useQuery({ year: selectedYear });
  const scheduleQuery = trpc.operational.getReportSchedule.useQuery();
  const overview = overviewQuery.data;
  const invalidate = async () => utils.operational.getOverview.invalidate({ year: selectedYear });
  const templateMutation = trpc.operational.ensureChecklistTemplate.useMutation({ onSuccess: invalidate });
  const checklistMutation = trpc.operational.addChecklistItem.useMutation({ onSuccess: async () => { setChecklistLabel(""); await invalidate(); } });
  const completionMutation = trpc.operational.setChecklistCompletion.useMutation({ onSuccess: invalidate });
  const removeChecklistMutation = trpc.operational.deleteChecklistItem.useMutation({ onSuccess: invalidate });
  const creditMutation = trpc.operational.upsertCredit.useMutation({ onSuccess: async () => { setCreditFormOpen(false); setCreditForm({ airline: "", creditType: "credito", value: "", expiresAt: "", code: "", notes: "" }); await invalidate(); } });
  const removeCreditMutation = trpc.operational.deleteCredit.useMutation({ onSuccess: invalidate });
  const goalMutation = trpc.operational.upsertGoal.useMutation({ onSuccess: invalidate });
  const deleteAttachmentMutation = trpc.operational.deleteAttachment.useMutation({ onSuccess: invalidate });
  const sendReportMutation = trpc.operational.sendExecutiveReport.useMutation({
    onSuccess: result => setFeedback({ kind: "success", message: `Relatório enviado para ${result.recipientCount} ${result.recipientCount === 1 ? "destinatário ativo" : "destinatários ativos"}.` }),
    onError: () => setFeedback({ kind: "error", message: "Não foi possível enviar o relatório. Confirme os destinatários ativos no painel de notificações." }),
  });
  const scheduleMutation = trpc.operational.configureReportSchedule.useMutation({
    onSuccess: async result => {
      await scheduleQuery.refetch();
      setFeedback({ kind: "success", message: result.enabled ? "Relatório mensal agendado com sucesso." : "Relatório recorrente pausado." });
    },
    onError: () => setFeedback({ kind: "error", message: "Não foi possível atualizar o agendamento. Confirme que a versão publicada está ativa." }),
  });

  const activeWeek = selectedWeek ?? overview?.weeks.find(week => !week.isDeleted)?.weekNumber ?? null;
  const checklist = useMemo(
    () => overview?.checklists.filter(item => item.weekNumber === activeWeek) ?? [],
    [activeWeek, overview?.checklists]
  );
  const attachments = useMemo(
    () => overview?.attachments.filter(item => item.weekNumber === activeWeek) ?? [],
    [activeWeek, overview?.attachments]
  );
  const linkedWeek = overview?.weeks.find(week => week.weekNumber === activeWeek);

  const selectDecision = (weekNumber?: number) => {
    if (weekNumber) setSelectedWeek(weekNumber);
    setActiveTab("prepare");
  };

  const addTemplate = async () => {
    if (!activeWeek) return;
    setFeedback({ kind: "info", message: "Preparando checklist padrão da viagem..." });
    await templateMutation.mutateAsync({ year: selectedYear, weekNumber: activeWeek });
    setFeedback({ kind: "success", message: "Checklist padrão preparado para esta viagem." });
  };

  const addChecklist = async () => {
    if (!activeWeek || checklistLabel.trim().length < 2) return;
    await checklistMutation.mutateAsync({ year: selectedYear, weekNumber: activeWeek, category: checklistCategory, label: checklistLabel.trim(), dueAt: checklistDueAt ? new Date(`${checklistDueAt}T12:00:00`) : undefined });
    setChecklistDueAt("");
    setFeedback({ kind: "success", message: "Item adicionado ao checklist." });
  };

  const handleAttachment = async (file?: File) => {
    if (!file || !activeWeek) return;
    if (!(["application/pdf"].includes(file.type) || file.type.startsWith("image/")) || file.size > 10 * 1024 * 1024) {
      setFeedback({ kind: "error", message: "Envie um PDF ou imagem de até 10 MB." });
      return;
    }
    try {
      setFeedback({ kind: "info", message: "Enviando anexo com segurança..." });
      const params = new URLSearchParams({ year: String(selectedYear), weekNumber: String(activeWeek), fileName: file.name, attachmentType: file.type === "application/pdf" ? "recibo" : "comprovante" });
      const response = await fetch(`/api/operational/upload?${params.toString()}`, { method: "POST", credentials: "include", headers: { "Content-Type": file.type }, body: file });
      if (!response.ok) throw new Error();
      await invalidate();
      setFeedback({ kind: "success", message: "Anexo registrado no bilhete." });
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível enviar o anexo. Tente novamente." });
    } finally {
      if (attachmentInput.current) attachmentInput.current.value = "";
    }
  };

  const saveCredit = async () => {
    const cents = Math.round(Number(creditForm.value.replace(",", ".")) * 100);
    if (!creditForm.airline.trim() || !Number.isFinite(cents) || cents <= 0) {
      setFeedback({ kind: "error", message: "Informe companhia e valor válido para o crédito." });
      return;
    }
    await creditMutation.mutateAsync({
      year: selectedYear,
      airline: creditForm.airline.trim(),
      creditType: creditForm.creditType,
      originalCents: cents,
      availableCents: cents,
      status: "ativo",
      code: creditForm.code.trim() || undefined,
      notes: creditForm.notes.trim() || undefined,
      expiresAt: creditForm.expiresAt ? new Date(`${creditForm.expiresAt}T12:00:00`) : undefined,
    });
    setFeedback({ kind: "success", message: "Crédito registrado para acompanhamento." });
  };

  const exportReportCsv = () => {
    if (!overview) return;
    const rows = [
      ["Relatório executivo", String(selectedYear)],
      ["Pendências de compra", String(overview.totals.pendingPurchases)],
      ["Itens de checklist pendentes", String(overview.totals.incompleteChecklistItems)],
      ["Créditos ativos", formatCurrency(overview.totals.activeCreditsCents)],
      [],
      ["Decisão", "Prioridade", "Detalhe"],
      ...overview.decisions.map(item => [item.title, item.severity, item.description]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `relatorio-executivo-${selectedYear}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback({ kind: "success", message: "Relatório executivo exportado em CSV." });
  };

  if (overviewQuery.isLoading || !overview) {
    return <div className="grid min-h-screen place-items-center bg-slate-50"><Loader2 className="h-9 w-9 animate-spin text-[#17427e]" /></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-28 text-slate-900 sm:pb-10">
      <StandardPageHeader title="Controle operacional" icon={ShieldAlert} backHref="/" backLabel="Voltar ao planejamento" actions={<GlobalYearSelector />} />
      <div className="container py-5 sm:py-8">
        <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumo do controle operacional">
          <Metric icon={Plane} label="Compras pendentes" value={String(overview.totals.pendingPurchases)} tone="amber" />
          <Metric icon={ClipboardCheck} label="Checklist pendente" value={String(overview.totals.incompleteChecklistItems)} tone="sky" />
          <Metric icon={WalletCards} label="Créditos ativos" value={formatCurrency(overview.totals.activeCreditsCents)} tone="emerald" />
        </section>

        {feedback && <div role="status" className={`mt-4 rounded-xl border px-4 py-3 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 ${feedback.kind === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : feedback.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-sky-200 bg-sky-50 text-sky-800"}`}>{feedback.message}</div>}

        <div role="tablist" aria-label="Áreas do controle operacional" className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
          {tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17427e] ${activeTab === tab.id ? "bg-[#17427e] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{tab.label}</button>)}
        </div>

        {activeTab === "decisions" && <section role="tabpanel" className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <Card className="overflow-hidden border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-4"><div><h2 className="font-bold">Centro de decisões</h2><p className="text-sm text-slate-500">Ações ordenadas por risco, prazo e impacto financeiro.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{overview.decisions.length} sinais</span></div>
            {overview.decisions.length ? <div className="divide-y divide-slate-100">{overview.decisions.map(decision => <div key={decision.id} className="flex gap-3 p-4"><div className="pt-0.5">{decision.severity === "critical" ? <AlertTriangle className="h-5 w-5 text-rose-600" /> : decision.kind === "price" ? <Landmark className="h-5 w-5 text-amber-600" /> : <ShieldAlert className="h-5 w-5 text-sky-600" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{decision.title}</h3><StatusPill severity={decision.severity} /></div><p className="mt-1 text-sm text-slate-600">{decision.description}</p>{decision.weekNumber && <Button variant="outline" size="sm" onClick={() => selectDecision(decision.weekNumber)} className="mt-3">Abrir viagem</Button>}</div></div>)}</div> : <EmptyState title="Tudo sob controle" description="Não há decisões urgentes no exercício selecionado." />}
          </Card>
          <Card className="border-slate-200 p-5"><h2 className="font-bold">Regra de priorização</h2><p className="mt-2 text-sm leading-6 text-slate-600">O painel considera compra pendente, variação de cotação, retorno ausente, checklist próximo da viagem e validade de créditos. Nenhuma recomendação é fixa: tudo é recalculado a partir dos seus dados.</p><Button className="mt-5 w-full" variant="outline" onClick={() => setActiveTab("reports")}><FileText className="mr-2 h-4 w-4" />Ver relatório executivo</Button></Card>
        </section>}

        {activeTab === "prepare" && <section role="tabpanel" className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Preparação da viagem</h2><p className="text-sm text-slate-500">Checklist, anexos e linha do tempo por semana.</p></div><select aria-label="Selecionar semana da viagem" value={activeWeek ?? ""} onChange={event => setSelectedWeek(Number(event.target.value))} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17427e]">{overview.weeks.filter(week => !week.isDeleted).map(week => <option key={week.weekNumber} value={week.weekNumber}>Semana {week.weekNumber} · {week.departureDate}</option>)}</select></div>
            {linkedWeek && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><strong>Semana {linkedWeek.weekNumber}</strong> · Ida {linkedWeek.departureDate} · Retorno {linkedWeek.returnDate} · {linkedWeek.isTicketIssued ? " Bilhete emitido" : " Bilhete ainda não emitido"}</div>}
            <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => void addTemplate()} disabled={templateMutation.isPending}><ClipboardCheck className="mr-2 h-4 w-4" />{templateMutation.isPending ? "Preparando..." : "Criar checklist padrão"}</Button><Button size="sm" variant="outline" onClick={() => attachmentInput.current?.click()}><Upload className="mr-2 h-4 w-4" />Anexar comprovante</Button><input ref={attachmentInput} type="file" accept="image/*,application/pdf" className="sr-only" onChange={event => void handleAttachment(event.target.files?.[0])} /></div>
            <div className="mt-5 space-y-2">{checklist.map(item => <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"><TooltipLabel label={`${item.completed ? "Desmarcar" : "Concluir"} ${item.label}`}><button type="button" aria-label={`${item.completed ? "Desmarcar" : "Concluir"} ${item.label}`} onClick={() => completionMutation.mutate({ id: item.id, year: selectedYear, completed: !item.completed })} className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17427e] ${item.completed ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"}`}>{item.completed && <Check className="h-4 w-4" />}</button></TooltipLabel><span className={`min-w-0 flex-1 text-sm ${item.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{item.label}{item.dueAt && <small className="mt-0.5 block text-xs text-slate-500 no-underline">Prazo: {formatDate(item.dueAt)}</small>}</span><span className="text-xs text-slate-500">{item.category}</span><TooltipLabel label={`Remover ${item.label}`}><button type="button" aria-label={`Remover ${item.label}`} onClick={() => removeChecklistMutation.mutate({ id: item.id, year: selectedYear })} className="rounded p-1 text-slate-400 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-[#17427e]"><X className="h-4 w-4" /></button></TooltipLabel></div>)}</div>
            {!checklist.length && <EmptyState title="Checklist ainda não iniciado" description="Use o modelo padrão ou registre itens específicos desta viagem." />}
            <div className="mt-4 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"><select aria-label="Categoria do novo item" value={checklistCategory} onChange={event => setChecklistCategory(event.target.value as typeof checklistCategory)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">{checklistCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input aria-label="Novo item de checklist" value={checklistLabel} onChange={event => setChecklistLabel(event.target.value)} placeholder="Ex.: Confirmar traslado" className="min-h-10 min-w-0 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17427e]" /><input aria-label="Prazo do item de checklist" type="date" value={checklistDueAt} onChange={event => setChecklistDueAt(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm" /><Button onClick={() => void addChecklist()} disabled={checklistMutation.isPending || checklistLabel.trim().length < 2}><Plus className="mr-1 h-4 w-4" />Adicionar</Button></div>
          </Card>
          <Card className="border-slate-200 p-4"><h2 className="font-bold">Documentos e linha do tempo</h2><p className="mt-1 text-sm text-slate-500">Centralização do bilhete, comprovantes e etapas concluídas.</p><div className="mt-4 space-y-3 border-l-2 border-slate-200 pl-4"><TimelineItem label={linkedWeek?.isTicketIssued ? "Bilhete emitido" : "Emissão pendente"} detail={linkedWeek?.isTicketIssued ? "Dados de voo registrados no planejamento." : "Aguardando compra ou registro do bilhete."} complete={Boolean(linkedWeek?.isTicketIssued)} />{checklist.filter(item => item.completed).map(item => <TimelineItem key={item.id} label={item.label} detail="Checklist confirmado" complete />)}{attachments.map(item => <div key={item.id} className="relative"><span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-[#17427e]" /><a className="text-sm font-semibold text-[#17427e] underline-offset-2 hover:underline" href={item.storageUrl} target="_blank" rel="noreferrer">{item.fileName}</a><p className="text-xs text-slate-500">{item.attachmentType} · {formatDate(item.createdAt)}</p><button type="button" onClick={() => deleteAttachmentMutation.mutate({ id: item.id, year: selectedYear })} className="mt-1 text-xs font-medium text-rose-600 hover:underline">Remover</button></div>)}</div>{!attachments.length && <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Ainda não há comprovantes anexados a esta viagem.</p>}</Card>
        </section>}

        {activeTab === "credits" && <section role="tabpanel" className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]"><Card className="border-slate-200 overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-4"><div><h2 className="font-bold">Créditos, vouchers e reembolsos</h2><p className="text-sm text-slate-500">Valores recuperáveis com vencimento e saldo controlados.</p></div><Button size="sm" onClick={() => setCreditFormOpen(current => !current)}><Plus className="mr-1 h-4 w-4" />Novo</Button></div>{creditFormOpen && <div className="grid gap-3 border-b border-slate-100 bg-slate-50 p-4 sm:grid-cols-2"><input aria-label="Companhia do crédito" value={creditForm.airline} onChange={event => setCreditForm({ ...creditForm, airline: event.target.value })} placeholder="Companhia aérea" className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm" /><select aria-label="Tipo do crédito" value={creditForm.creditType} onChange={event => setCreditForm({ ...creditForm, creditType: event.target.value as typeof creditForm.creditType })} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="credito">Crédito</option><option value="voucher">Voucher</option><option value="reembolso">Reembolso</option></select><input aria-label="Valor do crédito" value={creditForm.value} onChange={event => setCreditForm({ ...creditForm, value: event.target.value })} placeholder="Valor em R$" inputMode="decimal" className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm" /><input aria-label="Vencimento do crédito" type="date" value={creditForm.expiresAt} onChange={event => setCreditForm({ ...creditForm, expiresAt: event.target.value })} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm" /><input aria-label="Código do crédito" value={creditForm.code} onChange={event => setCreditForm({ ...creditForm, code: event.target.value })} placeholder="Código opcional" className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm" /><Button onClick={() => void saveCredit()} disabled={creditMutation.isPending}>{creditMutation.isPending ? "Salvando..." : "Salvar crédito"}</Button></div>}<div className="divide-y divide-slate-100">{overview.credits.map(credit => <div key={credit.id} className="flex flex-wrap items-center gap-3 p-4"><WalletCards className="h-5 w-5 text-emerald-600" /><div className="min-w-[12rem] flex-1"><p className="font-semibold">{credit.airline.toUpperCase()} · {credit.creditType}</p><p className="text-sm text-slate-500">{credit.expiresAt ? `Vence em ${formatDate(credit.expiresAt)}` : "Sem vencimento informado"}{credit.code ? ` · ${credit.code}` : ""}</p></div><span className="font-bold text-emerald-700">{formatCurrency(credit.availableCents)}</span><button type="button" onClick={() => removeCreditMutation.mutate({ id: credit.id, year: selectedYear })} className="rounded p-1 text-slate-400 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-[#17427e]" aria-label={`Remover crédito ${credit.airline}`}><X className="h-4 w-4" /></button></div>)}</div>{!overview.credits.length && <EmptyState title="Nenhum crédito registrado" description="Registre vouchers e reembolsos para não perder valores recuperáveis." />}</Card><GoalsPanel goals={overview.goals} selectedYear={selectedYear} onSave={(category, targetValue) => goalMutation.mutate({ year: selectedYear, category, targetValue })} /></section>}

        {activeTab === "reports" && <section role="tabpanel" className="mt-5 grid gap-4 lg:grid-cols-2"><Card className="border-slate-200 p-5"><FileText className="h-7 w-7 text-[#17427e]" /><h2 className="mt-3 font-bold">Relatório executivo do exercício</h2><p className="mt-2 text-sm leading-6 text-slate-600">Consolida compras pendentes, checklist, créditos e decisões priorizadas. Gere o CSV para análise ou use a impressão do navegador para salvar uma versão em PDF.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button onClick={exportReportCsv}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button><Button variant="outline" onClick={() => window.print()}><FileText className="mr-2 h-4 w-4" />Imprimir / PDF</Button></div></Card><Card className="border-slate-200 p-5"><Landmark className="h-7 w-7 text-emerald-600" /><h2 className="mt-3 font-bold">Envio aos destinatários ativos</h2><p className="mt-2 text-sm leading-6 text-slate-600">Envie agora a síntese aos destinatários ativos cadastrados no painel de notificações. A mensagem não contém anexos e não altera bilhetes.</p><Button className="mt-4" onClick={() => sendReportMutation.mutate({ year: selectedYear })} disabled={sendReportMutation.isPending} aria-busy={sendReportMutation.isPending}>{sendReportMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando relatório...</> : <><FileText className="mr-2 h-4 w-4" />Enviar e-mail agora</>}</Button><div className="mt-5 border-t border-slate-100 pt-4"><h3 className="font-semibold">Envio recorrente</h3><p className="mt-1 text-sm text-slate-600">Agenda o resumo no primeiro dia de cada mês, às 09:00 no horário de Brasília.</p><select aria-label="Frequência do relatório executivo" value={reportCron} onChange={event => setReportCron(event.target.value)} className="mt-3 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="0 0 12 1 * *">Mensal · dia 1 às 09:00 (Brasília)</option><option value="0 0 12 * * 1">Semanal · segunda às 09:00 (Brasília)</option></select><div className="mt-3 flex gap-2"><Button size="sm" onClick={() => scheduleMutation.mutate({ year: selectedYear, enabled: true, cronExpression: reportCron })} disabled={scheduleMutation.isPending}>{scheduleMutation.isPending ? "Salvando..." : "Ativar envio recorrente"}</Button>{scheduleQuery.data?.enabled ? <Button size="sm" variant="outline" onClick={() => scheduleMutation.mutate({ year: selectedYear, enabled: false, cronExpression: scheduleQuery.data?.cronExpression ?? reportCron })}>Pausar</Button> : null}</div>{scheduleQuery.data?.enabled ? <p className="mt-3 text-xs font-medium text-emerald-700">Ativo desde a versão publicada. Último envio: {formatDate(scheduleQuery.data.lastSentAt)}</p> : <p className="mt-3 text-xs text-amber-800">Ative apenas depois que esta versão estiver publicada.</p>}</div></Card></section>}
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Plane; label: string; value: string; tone: "amber" | "sky" | "emerald" }) {
  const tones = { amber: "bg-amber-100 text-amber-700", sky: "bg-sky-100 text-sky-700", emerald: "bg-emerald-100 text-emerald-700" };
  return <Card className="border-slate-200 p-4"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div></div></Card>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="p-7 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 font-semibold text-slate-700">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p></div>;
}

function TimelineItem({ label, detail, complete }: { label: string; detail: string; complete: boolean }) {
  return <div className="relative"><span className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ${complete ? "bg-emerald-500" : "bg-amber-400"}`} /><p className="text-sm font-semibold text-slate-800">{label}</p><p className="text-xs text-slate-500">{detail}</p></div>;
}

function GoalsPanel({ goals, selectedYear, onSave }: { goals: Array<{ category: "viagens" | "orcamento" | "milhas" | "creditos"; targetValue: number }>; selectedYear: number; onSave: (category: "viagens" | "orcamento" | "milhas" | "creditos", targetValue: number) => void }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const labels = { viagens: "Viagens emitidas", orcamento: "Orçamento anual (R$)", milhas: "Milhas utilizadas", creditos: "Créditos recuperados (R$)" } as const;
  return <Card className="border-slate-200 p-5"><h2 className="font-bold">Metas por categoria</h2><p className="mt-1 text-sm text-slate-500">Objetivos independentes do exercício {selectedYear}.</p><div className="mt-4 space-y-3">{(Object.keys(labels) as Array<keyof typeof labels>).map(category => { const current = goals.find(goal => goal.category === category)?.targetValue; const value = drafts[category] ?? (current !== undefined ? String(category === "orcamento" || category === "creditos" ? current / 100 : current) : ""); return <div key={category}><label className="text-sm font-medium text-slate-700">{labels[category]}</label><div className="mt-1 flex gap-2"><input aria-label={labels[category]} value={value} inputMode="numeric" onChange={event => setDrafts({ ...drafts, [category]: event.target.value })} className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm" /><Button size="sm" variant="outline" onClick={() => { const base = Number(value.replace(",", ".")); if (Number.isFinite(base) && base >= 0) onSave(category, Math.round((category === "orcamento" || category === "creditos" ? base * 100 : base))); }}>Salvar</Button></div></div>; })}</div></Card>;
}
