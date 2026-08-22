import { ArrowLeft, type LucideIcon } from "lucide-react";
import React, { type ReactNode } from "react";
import { Link } from "wouter";

export interface AppPageHeaderProps {
  title: ReactNode;
  icon: LucideIcon;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

/** Cabeçalho navy compartilhado para rotas internas, com retorno e área de ações responsiva. */
export function AppPageHeader({
  title,
  icon: Icon,
  actions,
  backHref = "/",
  backLabel = "Voltar para a página inicial",
}: AppPageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-[#071a36] via-[#102f61] to-[#17427e] text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href={backHref}>
          <button
            type="button"
            aria-label={backLabel}
            className="flex items-center gap-1.5 rounded-sm text-sm font-medium text-white/80 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:ml-2">
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <h1 className="truncate text-base font-bold tracking-wide">{title}</h1>
        </div>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
