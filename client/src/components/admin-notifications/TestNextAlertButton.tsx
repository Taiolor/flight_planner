import React, { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, FlaskConical, Loader2 } from "lucide-react";

export function TestNextAlertButton({ year }: { year: number }) {
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const sendNextAlertMutation =
    trpc.adminNotifications.sendNextAlert.useMutation({
      onSuccess: result => {
        const message = `Notificação enviada para ${result.sent} dispositivo(s)!`;
        setFeedback({ kind: "success", message });
        toast.success(message);
      },
      onError: err => {
        const message = err.message || "Erro ao enviar notificação.";
        setFeedback({ kind: "error", message });
        toast.error(message);
      },
    });

  const handleTest = () => {
    setFeedback(null);
    sendNextAlertMutation.mutate({ year });
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button
        size="sm"
        variant="outline"
        className="gap-2 border-[#c8d6e9] text-[#17427e] hover:bg-[#f4f7fb]"
        onClick={handleTest}
        disabled={sendNextAlertMutation.isPending}
        aria-busy={sendNextAlertMutation.isPending}
      >
        {sendNextAlertMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : feedback?.kind === "success" ? (
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
        ) : (
          <FlaskConical className="w-4 h-4" aria-hidden="true" />
        )}
        {sendNextAlertMutation.isPending
          ? "Enviando..."
          : feedback?.kind === "success"
            ? "Enviado"
            : "Testar"}
      </Button>
      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live={feedback.kind === "error" ? "assertive" : "polite"}
          className={`max-w-xs text-xs animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none ${
            feedback.kind === "success" ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {feedback.kind === "error" && <AlertCircle className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />}
          {feedback.message}
        </p>
      )}
    </div>
  );
}
