import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";

export function TestNextAlertButton() {
  const [isLoading, setIsLoading] = useState(false);
  const sendNextAlertMutation =
    trpc.adminNotifications.sendNextAlert.useMutation({
      onSuccess: result => {
        toast.success(
          `Notificação enviada para ${result.sent} dispositivo(s)!`
        );
        setIsLoading(false);
      },
      onError: err => {
        toast.error(err.message || "Erro ao enviar notificação.");
        setIsLoading(false);
      },
    });

  const handleTest = async () => {
    setIsLoading(true);
    await sendNextAlertMutation.mutateAsync();
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
      onClick={handleTest}
      disabled={isLoading}
    >
      <FlaskConical className="w-4 h-4" />
      {isLoading ? "Enviando..." : "Testar"}
    </Button>
  );
}
