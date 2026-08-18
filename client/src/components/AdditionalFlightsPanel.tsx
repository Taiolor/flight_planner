import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { airlines } from "@/lib/flightData";
import { trpc } from "@/lib/trpc";
import { ChevronDown, ChevronUp, CopyPlus, Loader2, Pencil, Plane, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
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
  smilesPoints: null,
  latamPassPoints: null,
  departureRescheduled: 0,
  returnRescheduled: 0,
  departureCancelled: 0,
  returnCancelled: 0,
});

const toDatetimeValue = (value: string | null) => value?.slice(0, 16) ?? "";

function toIsoDay(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
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
}: {
  year: number;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  flights: AdditionalFlightRecord[];
  onChanged: () => Promise<unknown> | void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdditionalFlightRecord | null>(null);
  const [flightPendingDeletion, setFlightPendingDeletion] = useState<AdditionalFlightRecord | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const createMutation = trpc.additionalFlights.create.useMutation();
  const updateMutation = trpc.additionalFlights.update.useMutation();
  const deleteMutation = trpc.additionalFlights.delete.useMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const beginCreate = () => {
    setEditing(null);
    setDraft(blankDraft());
    setOpen(true);
  };

  const beginEdit = (flight: AdditionalFlightRecord) => {
    const { id: _id, year: _year, weekNumber: _weekNumber, ...values } = flight;
    setEditing(flight);
    setDraft({
      ...values,
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
        <Button type="button" size="sm" onClick={beginCreate} className="bg-violet-600 hover:bg-violet-700"><Plus className="mr-1 h-4 w-4" /> Nova passagem</Button>
      </div>

      {open && (
        <div className="border-t border-violet-200 bg-white p-4">
          {flights.length > 0 && (
            <div className="mb-4 space-y-2">
              {flights.map((flight, index) => (
                <div key={flight.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2"><Plane className="h-4 w-4 text-violet-600" /><span className="font-bold text-slate-800">Passagem {index + 1}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${flight.ticketType === "oneway" ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800"}`}>{flight.ticketType === "oneway" ? "Somente ida" : "Ida e volta"}</span><span className="truncate text-xs text-slate-500">{flight.departureAirport || "—"} → {flight.returnAirport || "—"} · {flight.departureAirline || "Companhia a confirmar"}</span></div>
                  <div className="flex gap-1"><Button type="button" size="icon" variant="ghost" onClick={() => beginEdit(flight)} aria-label="Editar passagem adicional"><Pencil className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" disabled={deleteMutation.isPending} onClick={() => setFlightPendingDeletion(flight)} aria-label="Excluir passagem adicional"><Trash2 className="h-4 w-4 text-rose-600" /></Button></div>
                </div>
              ))}
            </div>
          )}

          {editing || (open && flights.length === 0) ? (
            <FlightForm
              draft={draft}
              setDraft={setDraft}
              title={editing ? "Editar passagem adicional" : "Adicionar passagem adicional"}
              isSaving={isSaving}
              weekStartDate={weekStartDate}
              weekEndDate={weekEndDate}
              onSave={persist}
              onCancel={() => { setEditing(null); setOpen(flights.length === 0); }}
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
  const toggleStatus = (key: "departureRescheduled" | "returnRescheduled" | "departureCancelled" | "returnCancelled", active: boolean) => {
    const counterpart = key.includes("Rescheduled") ? key.replace("Rescheduled", "Cancelled") : key.replace("Cancelled", "Rescheduled");
    setDraft({ ...draft, [key]: active ? 1 : 0, [counterpart]: active ? 0 : draft[counterpart as keyof Draft] });
  };
  const isRoundTrip = draft.ticketType !== "oneway";
  const periodLabel = weekStartDate && weekEndDate ? `${weekStartDate} a ${weekEndDate}` : "o período da semana selecionada";

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
      <div className="mb-4 flex items-center justify-between"><h4 className="font-black text-violet-950">{title}</h4><label className="flex items-center gap-2 text-sm font-bold text-violet-950"><Checkbox checked={Boolean(draft.isTicketIssued)} onCheckedChange={checked => set("isTicketIssued", checked ? 1 : 0)} /> Emitido</label></div>
      <p className="mb-4 rounded-lg border border-violet-200 bg-white/80 px-3 py-2 text-xs text-violet-900">Os trechos desta passagem devem ocorrer entre <strong>{periodLabel}</strong>.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo de passagem"><Select value={draft.ticketType || "roundtrip"} onValueChange={value => set("ticketType", value as Draft["ticketType"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="roundtrip">Ida e volta</SelectItem><SelectItem value="oneway">Somente ida</SelectItem></SelectContent></Select></Field>
        <Field label="Milhas Smiles"><Input inputMode="numeric" value={draft.smilesPoints ?? ""} onChange={event => set("smilesPoints", optionalNumber(event.target.value))} /></Field>
        <Field label="Milhas LATAM Pass"><Input inputMode="numeric" value={draft.latamPassPoints ?? ""} onChange={event => set("latamPassPoints", optionalNumber(event.target.value))} /></Field>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <LegFields title="Ida" direction="departure" draft={draft} set={set} onToggle={toggleStatus} minDate={toIsoDay(weekStartDate)} maxDate={toIsoDay(weekEndDate)} />
        {isRoundTrip && <LegFields title="Volta" direction="return" draft={draft} set={set} onToggle={toggleStatus} minDate={toIsoDay(weekStartDate)} maxDate={toIsoDay(weekEndDate)} />}
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="button" onClick={() => void onSave()} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar voo</Button></div>
    </div>
  );
}

function LegFields({ title, direction, draft, set, onToggle, minDate, maxDate }: { title: string; direction: "departure" | "return"; draft: Draft; set: <K extends keyof Draft>(key: K, value: Draft[K]) => void; onToggle: (key: "departureRescheduled" | "returnRescheduled" | "departureCancelled" | "returnCancelled", active: boolean) => void; minDate: string; maxDate: string }) {
  const isDeparture = direction === "departure";
  const prefix = isDeparture ? "departure" : "return";
  const key = (suffix: string) => `${prefix}${suffix}` as keyof Draft;
  const rescheduledKey = key("Rescheduled") as "departureRescheduled" | "returnRescheduled";
  const cancelledKey = key("Cancelled") as "departureCancelled" | "returnCancelled";
  return <div className="rounded-xl border border-white bg-white p-3 shadow-sm"><p className="mb-3 font-black text-slate-800">{title}</p><div className="grid gap-3"><Field label="Companhia"><Select value={(draft[key("Airline")] as string) || "none"} onValueChange={value => set(key("Airline"), value === "none" ? null : value)}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="none">Não definida</SelectItem>{airlines.filter(airline => airline.id !== "kayak").map(airline => <SelectItem key={airline.id} value={airline.name}>{airline.name}</SelectItem>)}</SelectContent></Select></Field><div className="grid grid-cols-2 gap-3"><Field label="Aeroporto"><Select value={(draft[key("Airport")] as string) || (isDeparture ? "GRU" : "NVT")} onValueChange={value => set(key("Airport"), value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GRU">GRU</SelectItem><SelectItem value="CGH">CGH</SelectItem><SelectItem value="NVT">NVT</SelectItem></SelectContent></Select></Field><Field label="Terminal"><Input value={(draft[key("Terminal")] as string) || ""} onChange={event => set(key("Terminal"), event.target.value || null)} /></Field></div><Field label="Data e hora"><Input type="datetime-local" min={minDate ? `${minDate}T00:00` : undefined} max={maxDate ? `${maxDate}T23:59` : undefined} value={toDatetimeValue(draft[key("FlightDatetime")] as string | null)} onChange={event => set(key("FlightDatetime"), event.target.value || null)} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Número do voo"><Input value={(draft[key("FlightNumber")] as string) || ""} onChange={event => set(key("FlightNumber"), event.target.value || null)} /></Field><Field label="Localizador"><Input value={(draft[key("Locator")] as string) || ""} onChange={event => set(key("Locator"), event.target.value || null)} /></Field></div><div className="flex flex-wrap gap-3 pt-1"><label className="flex items-center gap-2 text-xs font-semibold text-amber-700"><Checkbox checked={Boolean(draft[rescheduledKey])} onCheckedChange={checked => onToggle(rescheduledKey, Boolean(checked))} /> Remarcado</label><label className="flex items-center gap-2 text-xs font-semibold text-rose-700"><Checkbox checked={Boolean(draft[cancelledKey])} onCheckedChange={checked => onToggle(cancelledKey, Boolean(checked))} /> Cancelado</label></div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1"><Label className="text-xs font-bold text-slate-600">{label}</Label>{children}</div>; }

function optionalNumber(value: string) { const number = Number(value); return value === "" || !Number.isFinite(number) ? null : Math.max(0, Math.trunc(number)); }
