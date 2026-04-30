import { Badge } from "@/components/ui/badge";
import { CheckCircle2, History, Timer } from "lucide-react";

export type AlertStatus = "pending" | "sent" | "past";

export function StatusBadge({ status }: { status: AlertStatus }) {
  if (status === "sent") {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
        <CheckCircle2 className="w-3 h-3" /> Enviando
      </Badge>
    );
  }
  if (status === "past") {
    return (
      <Badge className="bg-gray-100 text-gray-500 border-gray-200 gap-1">
        <History className="w-3 h-3" /> Passado
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
      <Timer className="w-3 h-3" /> Aguardando
    </Badge>
  );
}
