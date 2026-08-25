import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, Download, Share2, Smartphone } from "lucide-react";
import React from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type IosNavigator = Navigator & { standalone?: boolean };

function isInstalledApp() {
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (navigator as IosNavigator).standalone
  );
}

/** Mantém a instalação do PWA explícita e orientada, inclusive em navegadores sem prompt nativo. */
export function PwaInstallGuide() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);

  React.useEffect(() => {
    setIsInstalled(isInstalledApp());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const requestInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-2 px-2 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white"
          data-pwa-install-guide-trigger
        >
          <Download className="size-4 text-cyan-300" aria-hidden="true" />
          {isInstalled ? "Aplicativo instalado" : "Instalar aplicativo"}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#315c99] bg-[#071a36] text-white sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-1 flex size-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 sm:mx-0">
            <span className="text-sm font-black tracking-tight">SF</span>
          </div>
          <DialogTitle>Leve o Smart Fly com você</DialogTitle>
          <DialogDescription className="text-slate-300">
            Instale o planejador para abrir seus voos em uma janela própria e acessar mais rápido no celular ou computador.
          </DialogDescription>
        </DialogHeader>

        {isInstalled ? (
          <div className="rounded-xl border border-emerald-300/35 bg-emerald-400/10 p-4 text-sm text-emerald-50">
            <CheckCircle2 className="mr-2 inline size-4" aria-hidden="true" />
            O aplicativo já está instalado neste dispositivo.
          </div>
        ) : deferredPrompt ? (
          <div className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm text-cyan-50">
            Seu navegador já permite uma instalação segura e imediata.
          </div>
        ) : (
          <ol className="space-y-3 text-sm text-slate-200">
            <li className="flex gap-3">
              <Share2 className="mt-0.5 size-4 shrink-0 text-cyan-300" aria-hidden="true" />
              <span><strong>No iPhone/iPad:</strong> abra o menu Compartilhar do Safari e escolha <em>Adicionar à Tela de Início</em>.</span>
            </li>
            <li className="flex gap-3">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-cyan-300" aria-hidden="true" />
              <span><strong>No Android ou computador:</strong> abra o menu do navegador e escolha <em>Instalar aplicativo</em> ou <em>Adicionar à tela inicial</em>.</span>
            </li>
          </ol>
        )}

        <DialogFooter>
          {deferredPrompt && !isInstalled && (
            <Button
              type="button"
              onClick={() => void requestInstall()}
              disabled={isInstalling}
              className="bg-white text-[#071a36] hover:bg-slate-100"
            >
              <Download className="mr-2 size-4" aria-hidden="true" />
              {isInstalling ? "Abrindo instalador..." : "Instalar agora"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
