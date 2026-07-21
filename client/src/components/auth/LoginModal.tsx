import { useState } from "react";
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

  const loginMutation = trpc.flightAuth.login.useMutation();
  const authUtils = trpc.useUtils();

  const handleLogin = () => {
    setLoginError("");
    loginMutation.mutate(
      { email: loginEmail, password: loginPassword },
      {
        onSuccess: () => {
          onOpenChange(false);
          setLoginEmail("");
          setLoginPassword("");
          authUtils.flightAuth.check.invalidate();
          authUtils.flights.getWeeks.invalidate();
          toast.success("Login realizado com sucesso!");
        },
        onError: err => {
          setLoginError(err.message || "E-mail ou senha incorretos.");
        },
      }
    );
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
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
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
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
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
            disabled={loginMutation.isPending || !loginEmail || !loginPassword}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loginMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Lock className="w-4 h-4 mr-2" />
            )}
            Entrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
