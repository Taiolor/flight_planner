import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const CITY_BACKDROPS = [
  {
    city: "Blumenau",
    subject: "Parque Vila Germânica",
    src: "/manus-storage/blumenau_0c5430d7.jpg",
    credit: "Roberto de Vasconcelos · CC BY-SA 3.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Blumenau_sc_-_panoramio_(18).jpg",
  },
  {
    city: "São Paulo",
    subject: "Panorama do centro",
    src: "/manus-storage/sao-paulo_da0e548a.jpg",
    credit: "Wilfredor · CC0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Panoramic_view_of_S%C3%A3o_Paulo_city_center.jpg",
  },
  {
    city: "Rio de Janeiro",
    subject: "Botafogo visto da Urca",
    src: "/manus-storage/rio-de-janeiro_3f37d89b.jpg",
    credit: "Lima Andruška · CC BY-SA 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Rio_de_Janeiro_at_night.jpg",
  },
  {
    city: "Porto Alegre",
    subject: "Paisagem noturna",
    src: "/manus-storage/porto-alegre_14400559.jpg",
    credit: "Felipe Valduga · CC BY 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Porto_Alegre_-_Brazil_Landscape-Night.jpg",
  },
  {
    city: "Joinville",
    subject: "Centro e bairro América",
    src: "/manus-storage/joinville_af0d11c7.jpg",
    credit: "Unmoralisch · CC BY-SA 3.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Panoramicajoinvillecentroamerica_big.jpg",
  },
  {
    city: "Goiânia",
    subject: "Panorama urbano",
    src: "/manus-storage/goiania_c168de7c.jpg",
    credit: "A C Moraes · CC BY 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Goi%C3%A2nia_Panorama.jpg",
  },
  {
    city: "Ribeirão Preto",
    subject: "Panorama visto de Cravinhos",
    src: "/manus-storage/ribeirao-preto_2765aed4.jpg",
    credit: "Anderson Bueno Pereira · CC BY-SA 4.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Panorama_Cravinhos_Ribeir%C3%A3o_Preto.jpg",
  },
  {
    city: "Itu",
    subject: "Vista aérea do centro",
    src: "/manus-storage/itu_6771c3c3.jpg",
    credit: "Victor de Andrade Lopes · CC BY-SA 4.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Vista_a%C3%A9rea_de_Itu_2021_01.jpg",
  },
] as const;

const AUTO_ADVANCE_MS = 10_000;

export function CityBackgroundCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!isPlaying || prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % CITY_BACKDROPS.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const activeBackdrop = CITY_BACKDROPS[activeIndex];
  const goTo = (index: number) => {
    setActiveIndex((index + CITY_BACKDROPS.length) % CITY_BACKDROPS.length);
  };

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#081225]">
        {CITY_BACKDROPS.map((backdrop, index) => (
          <div
            key={backdrop.city}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1800ms] motion-reduce:transition-none ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${backdrop.src})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,18,37,.94)_0%,rgba(8,18,37,.70)_42%,rgba(15,23,42,.52)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(217,70,239,.26),transparent_28%),radial-gradient(circle_at_18%_85%,rgba(14,165,233,.24),transparent_30%)]" />
      </div>

      <div className="absolute right-4 top-20 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/20 bg-slate-950/45 p-2.5 text-white shadow-xl backdrop-blur-md sm:right-8 sm:top-24">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 px-1">
            <p className="truncate text-sm font-black">{activeBackdrop.city}</p>
            <p className="truncate text-[11px] text-slate-300">{activeBackdrop.subject}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/15 hover:text-white"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Ver cidade anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/15 hover:text-white"
              onClick={() => setIsPlaying(playing => !playing)}
              aria-label={isPlaying ? "Pausar carrossel de cidades" : "Reproduzir carrossel de cidades"}
              aria-pressed={!isPlaying}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/15 hover:text-white"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Ver próxima cidade"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2">
          <div className="flex gap-1" aria-label="Selecionar foto da cidade">
            {CITY_BACKDROPS.map((backdrop, index) => (
              <button
                key={backdrop.city}
                type="button"
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Exibir ${backdrop.city}`}
                aria-current={index === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
          <a
            href={activeBackdrop.creditUrl}
            target="_blank"
            rel="noreferrer"
            className="truncate text-[10px] text-slate-300 underline-offset-2 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Foto: {activeBackdrop.credit}
          </a>
        </div>
      </div>
    </>
  );
}

export { CITY_BACKDROPS };
