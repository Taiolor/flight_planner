import { AIChatBox } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginRequiredMessageBox } from "@/components/auth/LoginRequiredMessageBox";
import { useYear } from "@/contexts/YearContext";
import { trpc } from "@/lib/trpc";
import { Bot, MessageCircle, ShieldCheck, Trash2, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "Qual é meu próximo voo?",
  "Há algum voo cancelado?",
  "Quanto já foi gasto em passagens?",
  "Quais cidades estão no planejamento?",
];

type FlyIaClientMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function FlyIA() {
  const { selectedYear } = useYear();
  const [open, setOpen] = useState(false);
  const [showLoginRequiredMessage, setShowLoginRequiredMessage] = useState(false);
  const [messages, setMessages] = useState<FlyIaClientMessage[]>([]);
  const internalSessionQuery = trpc.flightAuth.check.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const chatMutation = trpc.flyIa.chat.useMutation({
    onSuccess: result => {
      setMessages(current => [
        ...current,
        { role: "assistant", content: result.response },
      ]);
    },
    onError: error => {
      toast.error(error.message || "Não foi possível consultar o Fly.IA.");
    },
  });

  useEffect(() => {
    setMessages([]);
  }, [selectedYear]);

  const sendMessage = useCallback(
    (content: string) => {
      const userMessage: FlyIaClientMessage = { role: "user", content };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      chatMutation.mutate({ year: selectedYear, messages: nextMessages });
    },
    [chatMutation, messages, selectedYear]
  );

  const isInternalSessionAuthenticated =
    internalSessionQuery.data?.authenticated ?? false;

  const openFlyIa = () => {
    if (!isInternalSessionAuthenticated) {
      setShowLoginRequiredMessage(true);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        onClick={openFlyIa}
        className="fixed bottom-4 right-4 z-40 h-11 rounded-full bg-slate-900 px-3.5 text-white shadow-lg shadow-slate-900/20 transition-transform duration-150 hover:bg-slate-800 active:scale-[0.97] dark:bg-blue-600 dark:hover:bg-blue-500"
        aria-label="Abrir Fly.IA"
        title="Abrir Fly.IA"
      >
        <Bot className="h-4 w-4" aria-hidden="true" />
        <span className="ml-2 text-sm font-semibold">Fly.IA</span>
      </Button>

      {isInternalSessionAuthenticated && <DialogContent
        showCloseButton={false}
        className="fixed bottom-20 left-3 right-3 top-auto z-50 h-[min(660px,calc(100dvh-6.5rem))] w-auto max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl data-[state=open]:slide-in-from-bottom-4 sm:left-auto sm:right-5 sm:w-[430px] dark:border-slate-700"
      >
        <DialogHeader className="flex-row items-start gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 pr-2 text-left dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base text-slate-950 dark:text-slate-50">
              Fly.IA
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Assistente do planejamento de {selectedYear}
            </DialogDescription>
          </div>
          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-500"
              onClick={() => setMessages([])}
              aria-label="Limpar conversa"
              title="Limpar conversa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-slate-500"
              aria-label="Fechar Fly.IA"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          <AIChatBox
            messages={messages}
            onSendMessage={sendMessage}
            isLoading={chatMutation.isPending}
            height="100%"
            className="h-full rounded-none border-0 shadow-none"
            placeholder="Pergunte sobre voos, compras ou cidades..."
            emptyStateMessage="Olá, eu sou a Fly.IA. Como posso ajudar com seu planejamento?"
            suggestedPrompts={SUGGESTED_PROMPTS}
          />
        </div>

        <div className="flex items-center gap-1.5 border-t border-slate-100 bg-white px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Respostas baseadas nos dados do exercício selecionado.
        </div>
      </DialogContent>}
      </Dialog>
      <LoginRequiredMessageBox
        open={showLoginRequiredMessage}
        onOpenChange={setShowLoginRequiredMessage}
        onLogin={() => window.dispatchEvent(new Event("flight:require-login"))}
        title="Planejamento protegido"
        description="Entre para consultar o seu planejamento com o Fly.IA. Suas perguntas usam apenas os dados do exercício selecionado."
        loginLabel="Entrar para usar o Fly.IA"
      />
    </>
  );
}
