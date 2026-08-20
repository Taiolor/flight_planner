import type { LucideIcon } from "lucide-react";
import React, { type ReactNode } from "react";
import { LockKeyhole, PlaneTakeoff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type LoginRequiredMessageBoxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
  title?: string;
  description: string;
  loginLabel?: string;
};

type LoginRequiredScreenProps = {
  icon?: LucideIcon;
  title?: string;
  description: string;
  onLogin: () => void;
  loginLabel?: string;
  children?: ReactNode;
};

function AccessMessageContent({
  icon: Icon = LockKeyhole,
  title = "Entre para continuar",
  description,
  onLogin,
  loginLabel = "Entrar",
  compact = false,
}: Omit<LoginRequiredScreenProps, "children"> & { compact?: boolean }) {
  return (
    <div className={compact ? "py-2" : "p-7 sm:p-9"}>
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-blue-500/30">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="mt-5 text-center">
        <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
      <Button
        type="button"
        onClick={onLogin}
        className="mx-auto mt-6 flex min-h-11 gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
      >
        <PlaneTakeoff className="h-4 w-4" aria-hidden="true" />
        {loginLabel}
      </Button>
    </div>
  );
}

export function LoginRequiredMessageBox({
  open,
  onOpenChange,
  onLogin,
  title,
  description,
  loginLabel,
}: LoginRequiredMessageBoxProps) {
  const continueToLogin = () => {
    onOpenChange(false);
    onLogin();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
        <DialogHeader className="sr-only">
          <DialogTitle>{title ?? "Entre para continuar"}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AccessMessageContent
          title={title}
          description={description}
          loginLabel={loginLabel}
          onLogin={continueToLogin}
          compact
        />
        <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LoginRequiredScreen({
  icon,
  title,
  description,
  onLogin,
  loginLabel,
  children,
}: LoginRequiredScreenProps) {
  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-10 sm:px-6">
      <section
        role="status"
        aria-live="polite"
        className="w-full max-w-lg rounded-[2rem] border border-slate-200/80 bg-white/95 text-slate-950 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/95 dark:text-white"
      >
        <AccessMessageContent
          icon={icon}
          title={title}
          description={description}
          loginLabel={loginLabel}
          onLogin={onLogin}
        />
        {children && (
          <div className="border-t border-slate-100 px-7 py-4 text-center dark:border-slate-800">
            {children}
          </div>
        )}
      </section>
    </div>
  );
}
