import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  const loginInProgress = useRef(false);

  const loginMutation = trpc.flightAuth.login.useMutation();
  const authUtils = trpc.useUtils();
  const isLoggingIn = loginMutation.isPending || isVerifyingSession;

  const handleLogin = async () => {
    if (loginInProgress.current || !loginEmail || !loginPassword) return;
    loginInProgress.current = true;
    setLoginError("");
    try {
      await loginMutation.mutateAsync({ email: loginEmail, password: loginPassword });
      setIsVerifyingSession(true);
      // Não reutilizar uma checagem anônima em andamento ou armazenada no cache.
      await authUtils.flightAuth.check.cancel();
      const session = await authUtils.flightAuth.check.fetch(undefined, { staleTime: 0 });
      if (!session.authenticated) {
        throw new Error(
          "O navegador não confirmou a sessão. Abra a prévia em uma nova aba e tente novamente."
        );
      }
      // A checagem atualiza todos os observadores de autenticação; os demais dados
      // devem ser reconsultados com o cookie confirmado, sem liberação otimista.
      await authUtils.invalidate();
      onOpenChange(false);
      setLoginEmail("");
      setLoginPassword("");
      toast.success("Login realizado com sucesso!");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setIsVerifyingSession(false);
      loginInProgress.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Acesso Restrito
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-500">
            Faça login para editar preços, datas e status dos bilhetes.
          </p>
          {loginError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {loginError}
            </div>
          )}
          <div>
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="mt-1"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div>
            <Label htmlFor="login-password">Senha</Label>
            <div className="relative mt-1">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm p-0.5"
                onClick={() => setShowPassword(!showPassword)}
                aria-pressed={showPassword}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setLoginError("");
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn || !loginEmail || !loginPassword}
            aria-busy={isLoggingIn}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Lock className="w-4 h-4 mr-2" />
            )}
            {isVerifyingSession ? "Confirmando sessão..." : "Entrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
