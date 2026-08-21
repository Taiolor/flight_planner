import { getAllFlightWeeks } from "./db";
import { makeRequest, type DirectionsResult } from "./_core/map";
import { getAirportAddress } from "../shared/airportAddresses";
import { findNextIssuedFlight, formatFlightDatetime, type FlyIaMessage } from "./flyIa";

function latestUserQuestion(messages: FlyIaMessage[]) {
  return messages.filter(message => message.role === "user").at(-1)?.content ?? "";
}

export function extractTravelOrigin(messages: FlyIaMessage[]) {
  const question = latestUserQuestion(messages);
  if (!/(quanto\s+tempo|tempo.*(?:chegar|demoro)|demoro.*(?:chegar|aeroporto)|tr[aâ]nsito|trajeto)/i.test(question)) return null;
  const match = question.match(/(?:saindo|partindo)\s+(?:do|da|de)?\s*([^?!]+?)(?=\s+(?:para|at[eé]|ao|aos?)\s+(?:o\s+)?aeroporto|[?!]|$)/i);
  const origin = match?.[1]?.trim().replace(/^local\s+/i, "");
  return origin && origin.length >= 3 && origin.length <= 160 ? origin : null;
}

type DirectionsResponse = DirectionsResult & { status?: string };

export async function getFlyIaTravelGuidanceAnswer(year: number, messages: FlyIaMessage[]) {
  const origin = extractTravelOrigin(messages);
  if (!origin) return null;

  const next = findNextIssuedFlight(await getAllFlightWeeks(year));
  if (!next) return "Não há um próximo voo emitido e ativo registrado para definir o aeroporto de destino da rota.";

  const destination = getAirportAddress(next.flight.airportFrom);
  try {
    const directions = await Promise.race([
      makeRequest<DirectionsResponse>("/maps/api/directions/json", {
        origin,
        destination,
        mode: "driving",
        departure_time: Math.floor(Date.now() / 1000),
        language: "pt-BR",
        region: "br",
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("route timeout")), 10_000)),
    ]);
    const leg = directions.routes?.[0]?.legs?.[0];
    if (!leg) throw new Error("route unavailable");
    const duration = leg.duration_in_traffic?.text ?? leg.duration.text;
    return [
      "**Estimativa de deslocamento até o aeroporto**",
      `- **Saída informada:** ${origin}`,
      `- **Destino:** ${next.flight.airportFrom} — ${destination}`,
      `- **Estimativa de carro no momento da consulta:** ${duration}${leg.distance?.text ? ` · ${leg.distance.text}` : ""}`,
      `- **Voo considerado (base SmartFly):** ${formatFlightDatetime(next.flight.datetime)}`,
      "- **Fonte da estimativa:** [Google Maps — rotas](https://maps.google.com/).",
      "",
      "A estimativa é consultada no Google Maps e pode variar com trânsito e condições da rota. Ela não altera a data, a hora ou o status cadastrados do seu voo no SmartFly.",
    ].join("\n");
  } catch (error) {
    console.error("[Fly.IA Route] Não foi possível consultar a estimativa de deslocamento", error instanceof Error ? error.name : "unknown");
    return "Não consegui consultar a estimativa de rota agora. O horário do seu voo continua sendo o registrado na base do SmartFly.";
  }
}
