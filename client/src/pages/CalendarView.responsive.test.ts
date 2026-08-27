import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Calendar mobile responsiveness", () => {
  const calendarSource = readFileSync(
    resolve(process.cwd(), "client/src/pages/CalendarView.tsx"),
    "utf8"
  );
  const cupSource = readFileSync(
    resolve(process.cwd(), "client/src/components/BrazilWorldCupPanel.tsx"),
    "utf8"
  );

  it("uses a compact, non-growing monthly flight counter", () => {
    expect(calendarSource).toContain("flex shrink-0 items-center gap-0.5");
    expect(calendarSource).toContain('text-[9px] font-semibold px-1 py-0.5');
    expect(calendarSource).toContain("from-[#071a36] via-[#102f61] to-[#17427e]");
    expect(calendarSource).toContain("from-[#0b2349] to-[#17427e]");
    expect(calendarSource).toContain("bg-white/15 border border-white/35 text-white");
  });

  it("prioriza uma coluna abaixo de 360 px para preservar a leitura dos dias", () => {
    expect(calendarSource).toContain("grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5");
  });

  it("destaca voos cancelados com roxo-escuro distinto", () => {
    expect(calendarSource).toContain('cellBg = "bg-[#4B0082]";');
    expect(calendarSource).not.toContain('cellBg = "bg-slate-700";');
    expect(calendarSource).not.toContain('cellBg = "bg-slate-600";');
  });

  it("oferece interação de cartão acessível e com movimento reduzido para os dias de voo", () => {
    expect(calendarSource).toContain('data-calendar-flight-interactive={isClickable ? "true" : undefined}');
    expect(calendarSource).toContain('role={isClickable ? "button" : undefined}');
    expect(calendarSource).toContain("motion-safe:hover:scale-105");
    expect(calendarSource).toContain("motion-reduce:hover:scale-100");
    expect(calendarSource).toContain("triggerHaptic();");
    expect(calendarSource).toContain("onKeyDown={event => {");
    expect(calendarSource).toContain('event.key !== "Enter" && event.key !== " "');
    expect(calendarSource).toContain("event.preventDefault();");
  });

	  it("descreve voo remarcado para leitores de tela sem sobrepor texto ao dia", () => {
	    expect(calendarSource).toContain("com voo remarcado");
	    expect(calendarSource).not.toContain('"Rem."');
	    expect(calendarSource).not.toContain('"Canc."');
	  });

	  it("permite filtrar remarcações sem criar um marcador textual na célula", () => {
	    expect(calendarSource).toContain("showOnlyRescheduledFlights");
	    expect(calendarSource).toContain('id="rescheduled-flights-filter"');
	    expect(calendarSource).toContain("Mostrar apenas voos remarcados");
	    expect(calendarSource).toContain('aria-label={mark ? `Abrir detalhes da semana ${mark.week.weekNumber}${anyCancelled ? ", com voo cancelado" : anyRescheduled ? ", com voo remarcado" : ""}` : undefined}');
  });

  it("explica de forma discreta o feedback tátil opcional", () => {
    expect(calendarSource).toContain("abrir um voo gera uma vibração curta opcional");
  });

	it("mantém uma legenda de status acima da grade anual", () => {
	  expect(calendarSource).toContain("Legenda persistente de status dos voos");
	  expect(calendarSource).toContain('<StatusPill tone="success">Registrado</StatusPill>');
	  expect(calendarSource).toContain('<StatusPill tone="rescheduled">Remarcado</StatusPill>');
	  expect(calendarSource).toContain('<StatusPill tone="cancelled">Cancelado</StatusPill>');
	});

	it("preserva o dia legível sem marcador sobreposto em voos remarcados", () => {
	  const dayCellSource = calendarSource.slice(
	    calendarSource.indexOf('<span className="leading-none">{day}</span>'),
	    calendarSource.indexOf("</div>\n                        );")
	  );

	  expect(dayCellSource).not.toContain("{mark && (");
	  expect(calendarSource).toContain('cellBg = "bg-red-500";');
	  expect(calendarSource).toContain('cellBg = "bg-red-400";');
	  expect(calendarSource).toContain('flightStatusHint = " • voo remarcado";');
	});

  it("permite recolher a legenda de status com preferência local validada", () => {
    expect(calendarSource).toContain("readCalendarStatusLegendExpanded");
    expect(calendarSource).toContain("saveCalendarStatusLegendExpanded");
    expect(calendarSource).toContain('aria-controls="calendar-status-legend-content"');
    expect(calendarSource).toContain("isStatusLegendExpanded && (");
  });

  it("keeps long World Cup opponent names visible instead of truncating them", () => {
    expect(cupSource).toContain("min-w-0 break-words text-right");
    expect(cupSource).not.toContain(
      'text-xs font-bold text-slate-800 truncate text-right'
    );
  });
});
