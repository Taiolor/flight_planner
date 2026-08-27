import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const CITY_BACKDROPS = [
  {
    id: "blumenau",
    city: "Blumenau",
    subject: "Parque Vila Germânica",
    src: "/smartfly-assets/blumenau_0c5430d7.jpg",
    credit: "Roberto de Vasconcelos · CC BY-SA 3.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Blumenau_sc_-_panoramio_(18).jpg",
  },
  {
    id: "sao-paulo",
    city: "São Paulo",
    subject: "Panorama do centro",
    src: "/smartfly-assets/sao-paulo_da0e548a.jpg",
    credit: "Wilfredor · CC0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Panoramic_view_of_S%C3%A3o_Paulo_city_center.jpg",
  },
  {
    id: "rio-de-janeiro",
    city: "Rio de Janeiro",
    subject: "Botafogo visto da Urca",
    src: "/smartfly-assets/rio-de-janeiro_3f37d89b.jpg",
    credit: "Lima Andruška · CC BY-SA 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Rio_de_Janeiro_at_night.jpg",
  },
  {
    id: "porto-alegre",
    city: "Porto Alegre",
    subject: "Paisagem noturna",
    src: "/smartfly-assets/porto-alegre_14400559.jpg",
    credit: "Felipe Valduga · CC BY 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Porto_Alegre_-_Brazil_Landscape-Night.jpg",
  },
  {
    id: "joinville",
    city: "Joinville",
    subject: "Centro e bairro América",
    src: "/smartfly-assets/joinville_af0d11c7.jpg",
    credit: "Unmoralisch · CC BY-SA 3.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Panoramicajoinvillecentroamerica_big.jpg",
  },
  {
    id: "goiania",
    city: "Goiânia",
    subject: "Panorama urbano",
    src: "/smartfly-assets/goiania_c168de7c.jpg",
    credit: "A C Moraes · CC BY 2.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Goi%C3%A2nia_Panorama.jpg",
  },
  {
    id: "ribeirao-preto",
    city: "Ribeirão Preto",
    subject: "Panorama visto de Cravinhos",
    src: "/smartfly-assets/ribeirao-preto_2765aed4.jpg",
    credit: "Anderson Bueno Pereira · CC BY-SA 4.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Panorama_Cravinhos_Ribeir%C3%A3o_Preto.jpg",
  },
  {
    id: "itu",
    city: "Itu",
    subject: "Vista aérea do centro",
    src: "/smartfly-assets/itu_6771c3c3.jpg",
    credit: "Victor de Andrade Lopes · CC BY-SA 4.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Vista_a%C3%A9rea_de_Itu_2021_01.jpg",
  },
  {
    id: "guarulhos",
    city: "Guarulhos",
    subject: "Vista panorâmica da cidade",
    src: "/smartfly-assets/guarulhos_dab4a2d7.jpg",
    credit: "Humanoo · domínio público",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Vista_da_cidade_de_Guarulhos_(SP).JPG",
  },
  {
    id: "piracicaba",
    city: "Piracicaba",
    subject: "Rio Piracicaba e a cidade",
    src: "/smartfly-assets/piracicaba_9040475e.jpg",
    credit: "Ultimo Romântico · CC BY-SA 2.0",
    creditUrl: "https://commons.wikimedia.org/wiki/File:Piracicaba-SP.jpg",
  },
  {
    id: "novo-hamburgo",
    city: "Novo Hamburgo",
    subject: "Biblioteca Pública histórica",
    src: "/smartfly-assets/novo-hamburgo_f09cf41e.jpg",
    credit: "Viviane Lauck · CC BY-SA 4.0",
    creditUrl:
      "https://commons.wikimedia.org/wiki/File:Biblioteca_P%C3%BAblica_-_Novo_Hamburgo_-_20240929164508.jpg",
  },
] as const;

const AUTO_ADVANCE_MS = 10_000;
export const FAVORITE_BACKDROP_STORAGE_KEY = "smartfly:memories:favorite-backdrop";
export const CAROUSEL_PANEL_COLLAPSED_STORAGE_KEY = "smartfly:memories:carousel-panel-collapsed";

export function getFavoriteBackdropId() {
  if (typeof window === "undefined") return null;
  const backdropId = window.localStorage.getItem(FAVORITE_BACKDROP_STORAGE_KEY);
  return CITY_BACKDROPS.some(backdrop => backdrop.id === backdropId)
    ? backdropId
    : null;
}

export function setFavoriteBackdropId(backdropId: string | null) {
  if (typeof window === "undefined") return;
  if (backdropId) {
    window.localStorage.setItem(FAVORITE_BACKDROP_STORAGE_KEY, backdropId);
  } else {
    window.localStorage.removeItem(FAVORITE_BACKDROP_STORAGE_KEY);
  }
}

export function getCarouselPanelCollapsed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CAROUSEL_PANEL_COLLAPSED_STORAGE_KEY) === "true";
}

export function setCarouselPanelCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CAROUSEL_PANEL_COLLAPSED_STORAGE_KEY, String(collapsed));
}

export function CityBackgroundCarousel() {
  const [favoriteBackdropId, setFavoriteBackdropIdState] = useState(
    getFavoriteBackdropId
  );
  const [activeIndex, setActiveIndex] = useState(() => {
    const favoriteBackdropId = getFavoriteBackdropId();
    const favoriteIndex = CITY_BACKDROPS.findIndex(
      backdrop => backdrop.id === favoriteBackdropId
    );
    return favoriteIndex >= 0 ? favoriteIndex : 0;
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(getCarouselPanelCollapsed);

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
  const favoriteBackdrop = CITY_BACKDROPS.find(
    backdrop => backdrop.id === favoriteBackdropId
  );
  const goTo = (index: number) => {
    setActiveIndex((index + CITY_BACKDROPS.length) % CITY_BACKDROPS.length);
  };
  const toggleFavorite = () => {
    const nextFavoriteId =
      favoriteBackdropId === activeBackdrop.id ? null : activeBackdrop.id;
    setFavoriteBackdropId(nextFavoriteId);
    setFavoriteBackdropIdState(nextFavoriteId);
  };
  const togglePanel = () => {
    setIsPanelCollapsed(collapsed => {
      const nextCollapsed = !collapsed;
      setCarouselPanelCollapsed(nextCollapsed);
      return nextCollapsed;
    });
  };

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[#081225]">
        {CITY_BACKDROPS.map((backdrop, index) => (
          <div
            key={backdrop.city}
            className={`absolute inset-0 bg-cover bg-center will-change-[opacity,transform] transition-[opacity,transform] duration-[2600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              index === activeIndex
                ? "scale-100 opacity-100"
                : "scale-[1.035] opacity-0"
            }`}
            style={{ backgroundImage: `url(${backdrop.src})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,18,37,.94)_0%,rgba(8,18,37,.70)_42%,rgba(15,23,42,.52)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(217,70,239,.26),transparent_28%),radial-gradient(circle_at_18%_85%,rgba(14,165,233,.24),transparent_30%)]" />
      </div>

      <aside
        aria-label="Controle do carrossel de cidades"
        className={`fixed bottom-20 right-4 z-20 overflow-hidden rounded-2xl border border-white/20 bg-slate-950/65 text-white shadow-xl backdrop-blur-md transition-[width,padding,border-radius,background-color] duration-300 ease-out motion-reduce:transition-none sm:bottom-24 sm:right-8 ${
          isPanelCollapsed
            ? "w-11 rounded-full p-1.5"
            : "w-[min(22rem,calc(100vw-2rem))] p-2.5"
        }`}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`absolute right-1.5 top-1.5 z-10 h-8 w-8 rounded-full text-white hover:bg-white/15 hover:text-white ${
            isPanelCollapsed ? "static" : ""
          }`}
          onClick={togglePanel}
          aria-label={
            isPanelCollapsed
              ? "Expandir seletor de fotos para a esquerda"
              : "Recolher seletor de fotos para a lateral direita"
          }
          aria-expanded={!isPanelCollapsed}
          title={isPanelCollapsed ? "Expandir seletor de fotos" : "Recolher seletor de fotos"}
        >
          {isPanelCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <div
          className={`transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
            isPanelCollapsed
              ? "pointer-events-none h-0 -translate-x-3 overflow-hidden opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
        <div className="flex items-center justify-between gap-2 pr-8">
          <div className="min-w-0 px-1">
            <p className="truncate text-sm font-black">{activeBackdrop.city}</p>
            <p className="truncate text-[11px] text-slate-300">
              {activeBackdrop.subject} <span className="text-slate-400">•</span>{" "}
              <span className="font-medium text-cyan-100" aria-live="polite">
                {isPlaying ? "Transição suave ativa" : "Carrossel pausado"}
              </span>
            </p>
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
              size="sm"
              className="h-8 gap-1.5 rounded-full px-2.5 text-white hover:bg-white/15 hover:text-white"
              onClick={() => setIsPlaying(playing => !playing)}
              aria-label={isPlaying ? "Pausar carrossel de cidades" : "Reproduzir carrossel de cidades"}
              aria-pressed={isPlaying}
              title={isPlaying ? "Pausar transição automática" : "Retomar transição automática"}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span className="text-xs font-bold">{isPlaying ? "Pausar" : "Retomar"}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full text-white hover:bg-white/15 hover:text-white ${
                favoriteBackdropId === activeBackdrop.id ? "bg-fuchsia-500/35 text-fuchsia-100" : ""
              }`}
              onClick={toggleFavorite}
              aria-label={
                favoriteBackdropId === activeBackdrop.id
                  ? `Remover ${activeBackdrop.city} das favoritas`
                  : `Favoritar foto de ${activeBackdrop.city}`
              }
              aria-pressed={favoriteBackdropId === activeBackdrop.id}
              title={
                favoriteBackdropId === activeBackdrop.id
                  ? "Remover foto favorita"
                  : "Usar esta foto como favorita"
              }
            >
              <Heart
                className="h-4 w-4"
                fill={favoriteBackdropId === activeBackdrop.id ? "currentColor" : "none"}
              />
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
          <div className="min-w-0 text-right">
            <a
              href={activeBackdrop.creditUrl}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-[10px] text-slate-300 underline-offset-2 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Foto: {activeBackdrop.credit}
            </a>
            {favoriteBackdrop && (
              <p className="mt-0.5 truncate text-[10px] font-semibold text-fuchsia-100" aria-live="polite">
                Favorita: {favoriteBackdrop.city}
              </p>
            )}
          </div>
        </div>
        </div>
      </aside>
    </>
  );
}

export { CITY_BACKDROPS };
