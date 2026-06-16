import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonChart() {
  return (
    <div className="w-full h-96 bg-card rounded-lg border border-border p-6 space-y-4">
      {/* Título */}
      <Skeleton className="h-6 w-48" />

      {/* Legenda */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Gráfico */}
      <div className="w-full h-64 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-end gap-2 h-8">
            <Skeleton className="h-full flex-1" />
            <Skeleton className="h-full flex-1" />
            <Skeleton className="h-full flex-1" />
            <Skeleton className="h-full flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
