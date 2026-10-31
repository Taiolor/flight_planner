import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function AdditionalFlightHeaderAction({
  weekNumber,
  onRequest,
}: {
  weekNumber: number;
  onRequest: (weekNumber: number) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => onRequest(weekNumber)}
      className="border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200"
      title={`Adicionar passagem na semana ${weekNumber}`}
      aria-label={`Adicionar passagem na semana ${weekNumber}`}
    >
      <Plus className="w-4 h-4" />
    </Button>
  );
}
