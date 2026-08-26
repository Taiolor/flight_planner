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
import { CheckCircle2, Download, Share2, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import React from "react";
import { trpc } from "@/lib/trpc";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type IosNavigator = Navigator & { standalone?: boolean };

const PWA_INSTALLATION_CONSENT_KEY = "smartfly.pwa-installation-consent";
const PWA_INSTALLATION_ID_KEY = "smartfly.pwa-installation-id";

function isInstalledApp() {
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (navigator as IosNavigator).standalone
  );
}

function getPlatform(): "ios" | "android" | "desktop" | "unknown" {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  if (/android/.test(userAgent)) return "android";
  if (/windows|macintosh|linux/.test(userAgent)) return "desktop";
  return "unknown";
}

/** Mantém a instalação do PWA explícita e orientada, inclusive em navegadores sem prompt nativo. */
export function PwaInstallGuide({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [consent, setConsent] = React.useState(
    () => localStorage.getItem(PWA_INSTALLATION_CONSENT_KEY) === "granted"
  );
  const [installationId, setInstallationId] = React.useState<string | null>(
    () => localStorage.getItem(PWA_INSTALLATION_ID_KEY)
  );
  const recordInstallationMutation = trpc.pwaInstallations.record.useMutation();
  const deleteInstallationMutation = trpc.pwaInstallations.deleteCurrent.useMutation();

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

  const recordInstallation = (method: "native" | "manual") => {
    if (!isAuthenticated || !consent || installationId) return;
    const nextInstallationId = crypto.randomUUID();
    recordInstallationMutation.mutate(
      { installationId: nextInstallationId, platform: getPlatform(), method, consent: true },
      {
        onSuccess: () => {
          localStorage.setItem(PWA_INSTALLATION_ID_KEY, nextInstallationId);
          setInstallationId(nextInstallationId);
        },
      }
    );
  };

  const removeInstallationRecord = () => {
    const currentInstallationId = installationId;
    localStorage.removeItem(PWA_INSTALLATION_CONSENT_KEY);
    localStorage.removeItem(PWA_INSTALLATION_ID_KEY);
    setConsent(false);
    setInstallationId(null);
    if (currentInstallationId && isAuthenticated) {
      deleteInstallationMutation.mutate({ installationId: currentInstallationId });
    }
  };

  const requestInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        recordInstallation("native");
      }
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

        {isAuthenticated ? (
          <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-slate-200">
            {installationId ? (
              <div className="flex items-start justify-between gap-3">
                <p><ShieldCheck className="mr-1 inline size-4 text-emerald-300" aria-hidden="true" />Instalação registrada com consentimento. O histórico mantém apenas plataforma, método e data.</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeInstallationRecord}
                  disabled={deleteInstallationMutation.isPending}
                  className="shrink-0 text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="mr-1 size-3.5" aria-hidden="true" />Excluir
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={event => {
                    const allowed = event.target.checked;
                    setConsent(allowed);
                    if (allowed) localStorage.setItem(PWA_INSTALLATION_CONSENT_KEY, "granted");
                    else localStorage.removeItem(PWA_INSTALLATION_CONSENT_KEY);
                  }}
                  className="mt-0.5 size-4 accent-cyan-300"
                />
                <span>Autorizo registrar esta instalação de forma mínima, sem conta, IP ou identificador do aparelho. Posso apagar o registro a qualquer momento.</span>
              </label>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Entre para, se desejar, registrar a instalação de forma anônima e consentida.</p>
        )}

        {recordInstallationMutation.isError && (
          <p role="status" className="text-xs text-rose-200">Não foi possível registrar a instalação agora. O aplicativo continua disponível normalmente.</p>
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
          {!deferredPrompt && !installationId && isAuthenticated && (
            <Button
              type="button"
              onClick={() => {
                setIsInstalled(true);
                recordInstallation("manual");
              }}
              disabled={!consent || recordInstallationMutation.isPending}
              className="bg-white text-[#071a36] hover:bg-slate-100"
            >
              <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
              Já instalei o app
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
