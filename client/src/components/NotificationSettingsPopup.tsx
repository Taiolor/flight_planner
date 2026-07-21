import { useState, useEffect } from "react";
import { Bell, Settings2, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Opções de antecedência disponíveis
const ANTECEDENCIA_OPTIONS = [
  { label: "Desativado", value: 0 },
  { label: "30 minutos", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
  { label: "3 horas", value: 180 },
  { label: "4 horas", value: 240 },
  { label: "6 horas", value: 360 },
  { label: "12 horas", value: 720 },
  { label: "24 horas", value: 1440 },
  { label: "48 horas", value: 2880 },
];

const getAvisoLabel = (minutes: number) => {
  const opt = ANTECEDENCIA_OPTIONS.find(o => o.value === minutes);
  return opt ? opt.label : `${minutes}min`;
};

interface NotificationOptionProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  index: number;
  ariaLabel: string;
}

function NotificationOption({
  label,
  value,
  onChange,
  index,
  ariaLabel,
}: NotificationOptionProps) {
  const isFirst = index === 1;
  const gradientClass = isFirst
    ? "from-purple-500 to-cyan-500"
    : "from-cyan-500 to-purple-500";
  const textClass = isFirst ? "text-purple-400" : "text-cyan-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div
          className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
        >
          {index}
        </div>
        <label className="text-sm font-medium text-slate-200">{label}</label>
        {value > 0 && (
          <span
            className={`ml-auto text-xs flex items-center gap-1 ${textClass}`}
          >
            <Clock className="w-3 h-3" />
            {getAvisoLabel(value)}
          </span>
        )}
      </div>
      <Select value={String(value)} onValueChange={v => onChange(Number(v))}>
        <SelectTrigger
          aria-label={ariaLabel}
          className="bg-slate-800 border-slate-600 text-white h-10 text-sm w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-600 text-white">
          {ANTECEDENCIA_OPTIONS.map(opt => (
            <SelectItem
              key={opt.value}
              value={String(opt.value)}
              className="text-sm focus:bg-slate-700 focus:text-white"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface NotificationSettingsFormProps {
  aviso1: number;
  setAviso1: (val: number) => void;
  aviso2: number;
  setAviso2: (val: number) => void;
  onSave: () => void;
  isPending: boolean;
  saved: boolean;
}

function NotificationSettingsForm({
  aviso1,
  setAviso1,
  aviso2,
  setAviso2,
  onSave,
  isPending,
  saved,
}: NotificationSettingsFormProps) {
  return (
    <div className="space-y-4 p-1">
      <p className="text-xs text-slate-400 leading-relaxed">
        Configure com quantas horas de antecedência deseja receber avisos push
        antes de cada voo. Defina como{" "}
        <strong className="text-slate-300">Desativado</strong> para não receber
        aquele aviso.
      </p>

      <NotificationOption
        label="Aviso 1"
        value={aviso1}
        onChange={setAviso1}
        index={1}
        ariaLabel="Dias antes do voo (ida)"
      />

      <NotificationOption
        label="Aviso 2"
        value={aviso2}
        onChange={setAviso2}
        index={2}
        ariaLabel="Dias antes do voo (volta)"
      />

      {(aviso1 > 0 || aviso2 > 0) && (
        <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-400/30 p-3 space-y-1.5">
          <p className="text-xs text-slate-400 font-medium">Avisos ativos:</p>
          {aviso1 > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
              Aviso 1:{" "}
              <span className="text-purple-400 font-medium">
                {getAvisoLabel(aviso1)}
              </span>{" "}
              antes do voo
            </div>
          )}
          {aviso2 > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
              Aviso 2:{" "}
              <span className="text-cyan-400 font-medium">
                {getAvisoLabel(aviso2)}
              </span>{" "}
              antes do voo
            </div>
          )}
        </div>
      )}

      <Button
        onClick={onSave}
        disabled={isPending}
        className="w-full h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
            Salvando...
          </span>
        ) : saved ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Salvo!
          </span>
        ) : (
          "Salvar configurações"
        )}
      </Button>
    </div>
  );
}

interface NotificationSettingsPopupProps {
  isAuthenticated: boolean;
  onLoginRequired: () => void;
}

export function NotificationSettingsPopup({
  isAuthenticated,
  onLoginRequired,
}: NotificationSettingsPopupProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [aviso1, setAviso1] = useState<number>(1440);
  const [aviso2, setAviso2] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Buscar configurações do banco
  const settingsQuery = trpc.notificationSettings.get.useQuery(undefined, {
    enabled: isAuthenticated && open,
    retry: false,
  });

  // Sincronizar com banco ao abrir
  useEffect(() => {
    if (settingsQuery.data) {
      setAviso1(settingsQuery.data.aviso1Minutes);
      setAviso2(settingsQuery.data.aviso2Minutes);
    }
  }, [settingsQuery.data]);

  // Mutation para salvar
  const updateMutation = trpc.notificationSettings.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Configurações de notificação salvas!");
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 1200);
    },
    onError: err => {
      toast.error("Erro ao salvar: " + err.message);
    },
  });

  const handleOpen = () => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    setOpen(true);
  };

  const handleSave = () => {
    updateMutation.mutate({ aviso1Minutes: aviso1, aviso2Minutes: aviso2 });
  };

  // Botão de abertura
  const TriggerButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={isMobile ? handleOpen : undefined}
      title="Configurar agendamentos de notificação"
      aria-label="Configurar agendamentos de notificação"
      className="flex items-center gap-1.5 text-xs h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10"
    >
      <Settings2 className="w-4 h-4" />
      <span className="hidden sm:inline">Avisos</span>
    </Button>
  );

  // Mobile: usa Dialog (portal isolado, sem conflito de eventos)
  if (isMobile) {
    return (
      <>
        {TriggerButton}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-slate-900 border border-white/10 text-white max-w-sm w-[calc(100vw-2rem)] rounded-2xl p-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
                <Bell className="w-4 h-4 text-blue-400" />
                Agendamento de Avisos
              </DialogTitle>
            </DialogHeader>
            <NotificationSettingsForm
              aviso1={aviso1}
              setAviso1={setAviso1}
              aviso2={aviso2}
              setAviso2={setAviso2}
              onSave={handleSave}
              isPending={updateMutation.isPending}
              saved={saved}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: usa Popover (gerencia foco e portais corretamente)
  return (
    <Popover
      open={open}
      onOpenChange={v => {
        if (!v) {
          setOpen(false);
          return;
        }
        handleOpen();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Configurar agendamentos de notificação"
          aria-label="Configurar agendamentos de notificação"
          className="flex items-center gap-1.5 text-xs h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Avisos</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 bg-slate-900 border border-white/10 text-white rounded-xl p-4 shadow-2xl"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
          <Bell className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-sm">Agendamento de Avisos</span>
        </div>
        <NotificationSettingsForm
          aviso1={aviso1}
          setAviso1={setAviso1}
          aviso2={aviso2}
          setAviso2={setAviso2}
          onSave={handleSave}
          isPending={updateMutation.isPending}
          saved={saved}
        />
      </PopoverContent>
    </Popover>
  );
}
