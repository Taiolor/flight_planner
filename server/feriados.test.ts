import { describe, expect, it } from "vitest";

// Replicar a lógica de feriados para testar no servidor (sem importar do client)
interface Feriado {
  data: string;
  nome: string;
  tipo: 'nacional' | 'facultativo';
}

const feriados2026: Feriado[] = [
  { data: '01/01/2026', nome: 'Confraternização Universal', tipo: 'nacional' },
  { data: '16/02/2026', nome: 'Carnaval (segunda)', tipo: 'facultativo' },
  { data: '17/02/2026', nome: 'Carnaval (terça)', tipo: 'facultativo' },
  { data: '03/04/2026', nome: 'Sexta-feira Santa', tipo: 'nacional' },
  { data: '05/04/2026', nome: 'Páscoa', tipo: 'nacional' },
  { data: '21/04/2026', nome: 'Tiradentes', tipo: 'nacional' },
  { data: '01/05/2026', nome: 'Dia do Trabalho', tipo: 'nacional' },
  { data: '04/06/2026', nome: 'Corpus Christi', tipo: 'nacional' },
  { data: '07/09/2026', nome: 'Independência do Brasil', tipo: 'nacional' },
  { data: '12/10/2026', nome: 'Nossa Senhora Aparecida', tipo: 'nacional' },
  { data: '02/11/2026', nome: 'Finados', tipo: 'nacional' },
  { data: '15/11/2026', nome: 'Proclamação da República', tipo: 'nacional' },
  { data: '20/11/2026', nome: 'Consciência Negra', tipo: 'nacional' },
  { data: '25/12/2026', nome: 'Natal', tipo: 'nacional' },
  { data: '01/01/2027', nome: 'Confraternização Universal', tipo: 'nacional' },
];

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

interface FeriadoInfo {
  feriado: Feriado;
  tipo: 'ida' | 'retorno' | 'intervalo';
}

function getFeriadosDaSemana(departureDate: string, returnDate: string): FeriadoInfo[] {
  const result: FeriadoInfo[] = [];
  const depDate = parseDate(departureDate);
  const retDate = parseDate(returnDate);

  for (const f of feriados2026) {
    const fDate = parseDate(f.data);
    const fTime = fDate.getTime();
    const depTime = depDate.getTime();
    const retTime = retDate.getTime();

    if (fTime === depTime) {
      result.push({ feriado: f, tipo: 'ida' });
    } else if (fTime === retTime) {
      result.push({ feriado: f, tipo: 'retorno' });
    } else if (fTime > depTime && fTime < retTime) {
      result.push({ feriado: f, tipo: 'intervalo' });
    }
  }
  return result;
}

describe("getFeriadosDaSemana", () => {
  it("retorna feriado na data de ida quando há feriado no domingo de partida", () => {
    // Tiradentes é 21/04/2026 (terça) - não é domingo, mas vamos testar com uma data de ida que coincide
    // Usamos 01/01/2026 como data de ida (Confraternização)
    const result = getFeriadosDaSemana('01/01/2026', '06/01/2026');
    const feriadoIda = result.filter(f => f.tipo === 'ida');
    expect(feriadoIda).toHaveLength(1);
    expect(feriadoIda[0]?.feriado.nome).toBe('Confraternização Universal');
  });

  it("retorna feriado na data de retorno quando há feriado na sexta de volta", () => {
    // Natal é 25/12/2026 (sexta)
    const result = getFeriadosDaSemana('20/12/2026', '25/12/2026');
    const feriadoRetorno = result.filter(f => f.tipo === 'retorno');
    expect(feriadoRetorno).toHaveLength(1);
    expect(feriadoRetorno[0]?.feriado.nome).toBe('Natal');
  });

  it("retorna feriados no intervalo quando há feriado entre ida e retorno", () => {
    // Tiradentes 21/04, Páscoa 05/04 - semana 19/04 a 24/04 tem Tiradentes no meio
    const result = getFeriadosDaSemana('19/04/2026', '24/04/2026');
    const feriadosIntervalo = result.filter(f => f.tipo === 'intervalo');
    expect(feriadosIntervalo.length).toBeGreaterThan(0);
    expect(feriadosIntervalo.some(f => f.feriado.nome === 'Tiradentes')).toBe(true);
  });

  it("retorna array vazio quando não há feriados na semana", () => {
    // Semana sem feriados: 08/03/2026 a 13/03/2026
    const result = getFeriadosDaSemana('08/03/2026', '13/03/2026');
    expect(result).toHaveLength(0);
  });

  it("detecta múltiplos feriados no intervalo", () => {
    // Semana de Carnaval: 15/02 a 20/02 - tem Carnaval segunda e terça no intervalo
    const result = getFeriadosDaSemana('15/02/2026', '20/02/2026');
    const feriadosIntervalo = result.filter(f => f.tipo === 'intervalo');
    expect(feriadosIntervalo.length).toBeGreaterThanOrEqual(2);
  });

  it("não inclui feriados fora do intervalo da semana", () => {
    // Semana 01/03 a 06/03 - não deve incluir Carnaval (16-17/02) nem Páscoa (05/04)
    const result = getFeriadosDaSemana('01/03/2026', '06/03/2026');
    expect(result).toHaveLength(0);
  });
});
