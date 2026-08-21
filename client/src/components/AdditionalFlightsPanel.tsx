import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { formatAirlineDisplayName } from "@/lib/airlinePresentation";
import { ChevronDown, ChevronUp, Copy, CopyPlus, Loader2, Minus, Pencil, Plane, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export type AdditionalFlightRecord = {
  id: number;
  year: number;
  weekNumber: number;
  isTicketIssued: number;
  departureAirline: string | null;
  returnAirline: string | null;
  departureFlightDatetime: string | null;
  returnFlightDatetime: string | null;
  departureAirport: string | null;
  returnAirport: string | null;
  departureLocator: string | null;
  returnLocator: string | null;
  departureFlightNumber: string | null;
  returnFlightNumber: string | null;
  departureTerminal: string | null;
  returnTerminal: string | null;
  ticketType: string | null;
  paidPriceCents: number | null;
  smilesPoints: number | null;
  latamPassPoints: number | null;
  departureRescheduled: number;
  returnRescheduled: number;
  departureCancelled: number;
  returnCancelled: number;
};

type Draft = Omit<AdditionalFlightRecord, "id" | "year" | "weekNumber" | "ticketType"> & {
  ticketType: "roundtrip" | "oneway" | null;
};

const blankDraft = (): Draft => ({
  isTicketIssued: 1,
  departureAirline: null,
  returnAirline: null,
  departureFlightDatetime: null,
  returnFlightDatetime: null,
  departureAirport: "GRU",
  returnAirport: "NVT",
  departureLocator: null,
  returnLocator: null,
  departureFlightNumber: null,
  returnFlightNumber: null,
  departureTerminal: null,
  returnTerminal: null,
  ticketType: "roundtrip",
  paidPriceCents: null,
  smilesPoints: null,
  latamPassPoints: null,
  departureRescheduled: 0,
  returnRescheduled: 0,
  departureCancelled: 0,
  returnCancelled: 0,
});

const toDatetimeValue = (value: string | null) => value?.slice(0, 16) ?? "";

const STANDARD_AIRLINES = [
  { id: "latam", label: "LATAM", logo: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-latam_a13bb510.png" },
  { id: "gol", label: "GOL", logo: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-gol_c86ba55a.png" },
  { id: "azul", label: "AZUL", logo: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028456038/HQ655wm9a6bck22hJAwYRc/logo-azul_e89c8b63.png" },
] as const;

const AIRPORT_OPTIONS = [
  ["GRU", "🛫 Guarulhos (GRU)"],
  ["CGH", "🛫 Congonhas (CGH)"],
  ["VCP", "🛫 Viracopos (VCP)"],
  ["NVT", "🛬 Navegantes (NVT)"],
  ["JOI", "🛬 Joinville (JOI)"],
] as const;

const AIRLINE_IATA_CODES: Record<string, string> = { latam: "LA", gol: "G3", azul: "AD" };

// Mantém as variantes estáticas disponíveis ao Tailwind para os cartões de ida e volta.
const STANDARD_LEG_CLASSNAMES = "border-blue-200 border-orange-200 border-blue-600 border-orange-600 focus:ring-blue-400 focus:ring-orange-400 bg-blue-100 bg-orange-100 text-blue-700 text-orange-700";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCents(cents: number | null) {
  return cents === null ? null : currencyFormatter.format(cents / 100);
}

function toCents(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function toIsoDay(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function dateAtMidnight(value: string) {
  const iso = toIsoDay(value);
  return iso ? `${iso}T00:00` : "";
}

function weekdayLabel(value: string | null, fallbackDate: string) {
  const raw = value || dateAtMidnight(fallbackDate);
  if (!raw) return null;
  const date = new Date(raw.includes("T") ? raw : `${raw}T12:00`);
  if (Number.isNaN(date.getTime())) return null;
  const label = date.toLocaleDateString("pt-BR", { weekday: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function normalizeAirlineId(value: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return STANDARD_AIRLINES.some(airline => airline.id === normalized)
    ? normalized
    : value;
}

function isOutsideWeek(datetime: string | null, start: string, end: string) {
  if (!datetime || !start || !end) return false;
  const day = datetime.slice(0, 10);
  return day < start || day > end;
}

export function normalizeAdditionalFlightDraft(draft: Draft) {
  if (draft.ticketType !== "oneway") {
    return {
      ...draft,
      departureFlightDatetime: draft.departureFlightDatetime || null,
      returnFlightDatetime: draft.returnFlightDatetime || null,
    };
  }

  return {
    ...draft,
    departureFlightDatetime: draft.departureFlightDatetime || null,
    returnAirline: null,
    returnFlightDatetime: null,
    returnAirport: null,
    returnLocator: null,
    returnFlightNumber: null,
    returnTerminal: null,
    returnRescheduled: 0,
    returnCancelled: 0,
  };
}

export function validateAdditionalFlightDraft(
  draft: Draft,
  weekStartDate: string,
  weekEndDate: string
) {
  const start = toIsoDay(weekStartDate);
  const end = toIsoDay(weekEndDate);
  if (draft.isTicketIssued && !draft.departureFlightDatetime) {
    return "Informe a data e hora do voo de ida antes de emitir a passagem adicional.";
  }
  if (draft.isTicketIssued && draft.ticketType !== "oneway" && !draft.returnFlightDatetime) {
    return "Informe a data e hora do voo de volta para uma passagem de ida e volta.";
  }
  if (isOutsideWeek(draft.departureFlightDatetime, start, end)) {
    return "A data da ida deve estar dentro do período da semana selecionada.";
  }
  if (draft.ticketType !== "oneway" && isOutsideWeek(draft.returnFlightDatetime, start, end)) {
    return "A data da volta deve estar dentro do período da semana selecionada.";
  }
  if (
    draft.ticketType !== "oneway" &&
    draft.departureFlightDatetime &&
    draft.returnFlightDatetime &&
    draft.returnFlightDatetime < draft.departureFlightDatetime
  ) {
    return "A volta não pode ocorrer antes da ida.";
  }
  return null;
}

export function AdditionalFlightsPanel({
  year,
  weekNumber,
  weekStartDate,
  weekEndDate,
  flights,
  onChanged,
  createRequestId,
}: {
  year: number;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  flights: AdditionalFlightRecord[];
  onChanged: () => Promise<unknown> | void;
  createRequestId?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdditionalFlightRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [flightPendingDeletion, setFlightPendingDeletion] = useState<AdditionalFlightRecord | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const createMutation = trpc.additionalFlights.create.useMutation();
  const updateMutation = trpc.additionalFlights.update.useMutation();
  const deleteMutation = trpc.additionalFlights.delete.useMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const beginCreate = () => {
    setEditing(null);
    setIsCreating(true);
    setDraft({
      ...blankDraft(),
      departureFlightDatetime: dateAtMidnight(weekStartDate) || null,
      returnFlightDatetime: dateAtMidnight(weekEndDate) || null,
    });
    setOpen(true);
  };

  useEffect(() => {
    if (createRequestId === null || createRequestId === undefined) return;
    beginCreate();
  }, [createRequestId]);

  const beginEdit = (flight: AdditionalFlightRecord) => {
    const { id: _id, year: _year, weekNumber: _weekNumber, ...values } = flight;
    setIsCreating(false);
    setEditing(flight);
    setDraft({
      ...values,
      departureAirline: normalizeAirlineId(values.departureAirline),
      returnAirline: normalizeAirlineId(values.returnAirline),
      ticketType:
        values.ticketType === "oneway" || values.ticketType === "roundtrip"
          ? values.ticketType
          : null,
    });
    setOpen(true);
  };

  const persist = async () => {
    const validationError = validateAdditionalFlightDraft(draft, weekStartDate, weekEndDate);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const payload = normalizeAdditionalFlightDraft(draft);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, year, ...payload });
        toast.success("Voo adicional atualizado.");
      } else {
        await createMutation.mutateAsync({ year, weekNumber, ...payload });
        toast.success("Voo adicional criado nesta semana.");
      }
      await onChanged();
      setOpen(false);
      setEditing(null);
      setIsCreating(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o voo adicional.");
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id, year });
      await onChanged();
      toast.success("Voo adicional removido.");
      setFlightPendingDeletion(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o voo adicional.");
    }
  };

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50/70">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button type="button" onClick={() => setOpen(value => !value)} className="flex items-center gap-2 text-left">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-600 text-white"><CopyPlus className="h-4 w-4" /></span>
          <span><span className="block text-sm font-black text-violet-950">Passagens adicionais</span><span className="block text-xs text-violet-700">{flights.length ? `${flights.length} passagem${flights.length > 1 ? "ens" : ""} vinculada${flights.length > 1 ? "s" : ""} a esta semana` : "Adicione uma passagem de ida e volta ou somente ida"}</span></span>
          {open ? <ChevronUp className="h-4 w-4 text-violet-700" /> : <ChevronDown className="h-4 w-4 text-violet-700" />}
        </button>
        <Button type="button" size="icon" onClick={beginCreate} className="h-9 w-9 rounded-full bg-violet-600 shadow-sm hover:bg-violet-700" aria-label="Adicionar passagem adicional" title="Adicionar passagem"><Plus className="h-5 w-5" /></Button>
      </div>

      {open && (
        <div className="border-t border-violet-200 bg-white p-4">
          {flights.length > 0 && (
            <div className="mb-4 space-y-2">
              {flights.map((flight, index) => (
                <div key={flight.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2"><Plane className="h-4 w-4 text-violet-600" /><span className="font-bold text-slate-800">Passagem {index + 1}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${flight.ticketType === "oneway" ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800"}`}>{flight.ticketType === "oneway" ? "Somente ida" : "Ida e volta"}</span><span className="truncate text-xs text-slate-500">{flight.departureAirport || "—"} → {flight.returnAirport || "—"} · {formatAirlineDisplayName(flight.departureAirline, "COMPANHIA A CONFIRMAR")}</span>{formatCents(flight.paidPriceCents) && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">{formatCents(flight.paidPriceCents)}</span>}</div>
                  <div className="flex gap-1"><Button type="button" size="icon" variant="ghost" onClick={() => beginEdit(flight)} aria-label="Editar passagem adicional" title="Editar passagem"><Pencil className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" disabled={deleteMutation.isPending} onClick={() => setFlightPendingDeletion(flight)} aria-label="Remover passagem adicional" title="Remover passagem"><Minus className="h-4 w-4 text-rose-600" /></Button></div>
                </div>
              ))}
            </div>
          )}

          {editing || isCreating || (open && flights.length === 0) ? (
            <FlightForm
              draft={draft}
              setDraft={setDraft}
              title={editing ? "Editar passagem adicional" : "Adicionar passagem adicional"}
              isSaving={isSaving}
              weekStartDate={weekStartDate}
              weekEndDate={weekEndDate}
              onSave={persist}
              onCancel={() => {
                setEditing(null);
                setIsCreating(false);
                setDraft(blankDraft());
                setOpen(false);
              }}
            />
          ) : null}
        </div>
      )}
      <AlertDialog open={Boolean(flightPendingDeletion)} onOpenChange={isOpen => !isOpen && setFlightPendingDeletion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir passagem adicional?</AlertDialogTitle>
            <AlertDialogDescription>
              A passagem{flightPendingDeletion?.ticketType === "oneway" ? " somente de ida" : " de ida e volta"} será removida da semana {weekNumber}. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" disabled={deleteMutation.isPending} onClick={() => flightPendingDeletion && void remove(flightPendingDeletion.id)}>{deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Excluir passagem</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function FlightForm({ draft, setDraft, title, isSaving, weekStartDate, weekEndDate, onSave, onCancel }: { draft: Draft; setDraft: (next: Draft) => void; title: string; isSaving: boolean; weekStartDate: string; weekEndDate: string; onSave: () => Promise<void>; onCancel: () => void }) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value });
  const isRoundTrip = draft.ticketType !== "oneway";
  const setTicketType = (ticketType: "roundtrip" | "oneway") => set("ticketType", ticketType);
  const clearLeg = (direction: "departure" | "return") => {
    const prefix = direction === "departure" ? "departure" : "return";
    setDraft({ ...draft, [`${prefix}Airport`]: null, [`${prefix}Airline`]: null, [`${prefix}FlightDatetime`]: null, [`${prefix}FlightNumber`]: null, [`${prefix}Locator`]: null, [`${prefix}Terminal`]: null } as Draft);
  };
  const copyDepartureField = (field: "Airline" | "Locator") => {
    setDraft({ ...draft, [`return${field}`]: draft[`departure${field}` as keyof Draft] } as Draft);
  };
  const toggleStatus = (key: "departureRescheduled" | "returnRescheduled" | "departureCancelled" | "returnCancelled", active: boolean) => {
    const counterpart = key.includes("Rescheduled") ? key.replace("Rescheduled", "Cancelled") : key.replace("Cancelled", "Rescheduled");
    setDraft({ ...draft, [key]: active ? 1 : 0, [counterpart]: active ? 0 : draft[counterpart as keyof Draft] });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <div><p className="text-sm font-bold text-slate-800">{title}</p><p className="text-xs text-slate-500">Use os mesmos dados e padrões do cartão da semana.</p></div>
        <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600"><Checkbox checked={Boolean(draft.isTicketIssued)} onCheckedChange={checked => set("isTicketIssued", checked ? 1 : 0)} /> Bilhete emitido</label>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Tipo de Bilhete</span>
        <div className="flex overflow-hidden rounded-lg border border-slate-200 shadow-sm" role="group" aria-label="Tipo de Bilhete">
          <button type="button" aria-label="Selecionar ida e volta" aria-pressed={isRoundTrip} onClick={() => setTicketType("roundtrip")} className={`px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${isRoundTrip ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>✈ Ida e Volta</button>
          <button type="button" aria-label="Selecionar somente ida" aria-pressed={!isRoundTrip} onClick={() => setTicketType("oneway")} className={`border-l border-slate-200 px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${!isRoundTrip ? "bg-orange-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>→ Somente Ida</button>
        </div>
      </div>
      <div className={`grid gap-3 ${isRoundTrip ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        <LegFields title="Ida" direction="departure" draft={draft} set={set} setDraft={setDraft} onToggle={toggleStatus} defaultDate={weekStartDate} onClear={() => clearLeg("departure")} onCopy={copyDepartureField} />
        {isRoundTrip && <LegFields title="Volta" direction="return" draft={draft} set={set} setDraft={setDraft} onToggle={toggleStatus} defaultDate={weekEndDate} onClear={() => clearLeg("return")} />}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pagamento</span>
        <div className="mt-2"><PaidPriceField value={draft.paidPriceCents} onChange={value => set("paidPriceCents", value)} /></div>
        <span className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pagamento em Milhas</span>
        <div className="mt-2 grid gap-2 sm:grid-cols-2"><MileageField label="SMILES" value={draft.smilesPoints} onChange={value => set("smilesPoints", value)} /><MileageField label="LATAM PASS" value={draft.latamPassPoints} onChange={value => set("latamPassPoints", value)} /></div>
      </div>
      <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="button" onClick={() => void onSave()} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar voo</Button></div>
    </div>
  );
}

function LegFields({ title, direction, draft, set, setDraft, onToggle, defaultDate, onClear, onCopy }: { title: string; direction: "departure" | "return"; draft: Draft; set: <K extends keyof Draft>(key: K, value: Draft[K]) => void; setDraft: (next: Draft) => void; onToggle: (key: "departureRescheduled" | "returnRescheduled" | "departureCancelled" | "returnCancelled", active: boolean) => void; defaultDate: string; onClear: () => void; onCopy?: (field: "Airline" | "Locator") => void }) {
  const isDeparture = direction === "departure";
  const prefix = isDeparture ? "departure" : "return";
  const key = (suffix: string) => `${prefix}${suffix}` as keyof Draft;
  const airlineKey = key("Airline");
  const airportKey = key("Airport");
  const datetimeKey = key("FlightDatetime");
  const flightNumberKey = key("FlightNumber");
  const locatorKey = key("Locator");
  const terminalKey = key("Terminal");
  const rescheduledKey = key("Rescheduled") as "departureRescheduled" | "returnRescheduled";
  const cancelledKey = key("Cancelled") as "departureCancelled" | "returnCancelled";
  const airline = String(draft[airlineKey] ?? "").toLowerCase();
  const selectedAirline = STANDARD_AIRLINES.find(item => item.id === airline);
  const datetime = (draft[datetimeKey] as string | null) || dateAtMidnight(defaultDate);
  const weekday = weekdayLabel(draft[datetimeKey] as string | null, defaultDate);
  const color = isDeparture ? "blue" : "orange";
  const setAirline = (nextAirline: string) => {
    const currentNumber = String(draft[flightNumberKey] ?? "").trim();
    const previousCode = AIRLINE_IATA_CODES[airline] ?? airline.toUpperCase().slice(0, 2);
    const nextCode = AIRLINE_IATA_CODES[nextAirline] ?? nextAirline.toUpperCase().slice(0, 2);
    setDraft({ ...draft, [airlineKey]: nextAirline, [flightNumberKey]: !currentNumber || currentNumber === previousCode ? nextCode : currentNumber } as Draft);
  };

  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 shadow-sm dark:border-slate-700 dark:bg-slate-700/50 dark:shadow-slate-900/40"><div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/50 px-4 py-2 dark:border-slate-600 dark:bg-slate-700"><div className="flex items-center gap-2"><Plane className={`h-4 w-4 text-slate-400 ${isDeparture ? "" : "rotate-180"}`} /><span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-200">{title}</span></div><button type="button" onClick={onClear} className={`px-2 py-1 text-[10px] font-semibold text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-1 ${isDeparture ? "focus-visible:ring-blue-400" : "focus-visible:ring-orange-400"}`} title={`Limpar dados do voo de ${title.toLowerCase()}`} aria-label={`Limpar dados do voo de ${title.toLowerCase()}`}>🗑️ Limpar</button></div><div className="flex flex-col gap-2.5 p-3"><div className="flex flex-col gap-1"><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Aeroporto</label><Select value={(draft[airportKey] as string) || ""} onValueChange={value => set(airportKey, value as Draft[typeof airportKey])}><SelectTrigger aria-label={`Aeroporto de ${title}`} className={`h-8 w-full border-${color}-200 bg-white text-xs dark:bg-slate-700 dark:text-slate-100`}><SelectValue placeholder="Selecionar aeroporto" /></SelectTrigger><SelectContent>{AIRPORT_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="flex flex-col gap-1"><div className="flex items-center justify-between"><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Companhia Aérea</label>{isDeparture && airline && onCopy && <CopyButton label="Copiar → Volta" onClick={() => onCopy("Airline")} />}</div><Select value={airline || "none"} onValueChange={value => value !== "none" && setAirline(value)}><SelectTrigger aria-label={`Companhia Aérea de ${title}`} className={`h-8 w-full border-${color}-200 bg-white text-xs dark:bg-slate-700 dark:text-slate-100`}><SelectValue placeholder="Selecionar companhia">{selectedAirline ? <span className="flex items-center gap-1.5"><img src={selectedAirline.logo} className="h-4 w-auto object-contain" alt={selectedAirline.label} />{selectedAirline.label}</span> : <span className="text-slate-400">Selecionar companhia</span>}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">Não definida</SelectItem>{STANDARD_AIRLINES.map(item => <SelectItem key={item.id} value={item.id}><span className="flex items-center gap-2"><img src={item.logo} className="h-5 w-auto object-contain" alt={item.label} />{item.label}</span></SelectItem>)}</SelectContent></Select></div><div className="flex flex-col gap-1"><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Data e Hora do Voo</label><input aria-label={`Data e Hora do Voo de ${title}`} type="datetime-local" className={`h-8 w-full rounded-md border border-${color}-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-${color}-400 dark:bg-slate-700 dark:text-slate-100`} value={datetime} onChange={event => set(datetimeKey, event.target.value as Draft[typeof datetimeKey])} />{weekday && <span className={`w-fit rounded-md bg-${color}-100 px-2 py-0.5 text-[11px] font-semibold text-${color}-700`}>{weekday}</span>}</div><div className="flex flex-col gap-1"><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Número do Voo</label><input aria-label={`Número do Voo de ${title}`} type="text" maxLength={10} placeholder="Ex: LA3045" className={`h-8 w-full rounded-md border border-${color}-200 bg-white px-2 text-xs font-mono uppercase text-slate-700 focus:outline-none focus:ring-2 focus:ring-${color}-400`} value={(draft[flightNumberKey] as string) || ""} onChange={event => set(flightNumberKey, event.target.value.toUpperCase() as Draft[typeof flightNumberKey])} /></div><div className="flex flex-col gap-1"><div className="flex items-center justify-between"><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Localizador (PNR)</label>{isDeparture && String(draft[locatorKey] ?? "").trim() && onCopy && <CopyButton label="Copiar → Volta" onClick={() => onCopy("Locator")} />}</div><input aria-label={`Localizador do Voo de ${title}`} type="text" maxLength={20} placeholder="Ex: ABC123" className={`h-8 w-full rounded-md border border-${color}-200 bg-white px-2 text-xs font-mono uppercase text-slate-700 focus:outline-none focus:ring-2 focus:ring-${color}-400`} value={(draft[locatorKey] as string) || ""} onChange={event => set(locatorKey, event.target.value.toUpperCase() as Draft[typeof locatorKey])} /></div><div className="flex flex-col gap-1"><label className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Terminal</label><Input value={(draft[terminalKey] as string) || ""} className={`h-8 border-${color}-200 text-xs`} onChange={event => set(terminalKey, (event.target.value || null) as Draft[typeof terminalKey])} /></div><div className="flex items-center gap-2 pt-1"><Checkbox checked={Boolean(draft[rescheduledKey])} onCheckedChange={checked => onToggle(rescheduledKey, Boolean(checked))} className="border-red-400 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500" /><span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">Voo Remarcado</span></div><div className="flex items-center gap-2 pt-1"><Checkbox checked={Boolean(draft[cancelledKey])} onCheckedChange={checked => onToggle(cancelledKey, Boolean(checked))} className="border-slate-500 data-[state=checked]:border-slate-700 data-[state=checked]:bg-slate-700" /><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Voo Cancelado</span></div></div></div>;
}

function CopyButton({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex items-center gap-0.5 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" title={label} aria-label={label}><Copy className="h-3 w-3" />{label}</button>; }

function MileageField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) { return <div className="flex items-center gap-2"><span className="w-20 flex-shrink-0 rounded bg-slate-700 px-2 py-1 text-center text-xs font-semibold text-white">{label}</span><Input inputMode="numeric" placeholder="0 pontos" className="h-8 text-xs" value={value ?? ""} onChange={event => onChange(optionalNumber(event.target.value))} /></div>; }

function PaidPriceField({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) { return <div className="flex items-center gap-2"><span className="w-20 flex-shrink-0 rounded bg-emerald-600 px-2 py-1 text-center text-xs font-semibold text-white">VALOR PAGO</span><Input aria-label="Preço pago da passagem adicional" inputMode="decimal" placeholder="R$ 0,00" className="h-8 text-xs" value={value === null ? "" : (value / 100).toFixed(2)} onChange={event => onChange(toCents(event.target.value))} /><span className="text-[10px] text-slate-500">em R$</span></div>; }

function optionalNumber(value: string) { const number = Number(value); return value === "" || !Number.isFinite(number) ? null : Math.max(0, Math.trunc(number)); }
