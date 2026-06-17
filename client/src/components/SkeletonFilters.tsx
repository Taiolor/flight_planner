import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonFilters() {
  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      {/* Linha 1: Mês, Companhia, Ordenar, Preço, Status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Linha 2: Horários e Botão Limpar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex items-end">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Resumo */}
      <div className="flex gap-2 justify-end">
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  );
}
