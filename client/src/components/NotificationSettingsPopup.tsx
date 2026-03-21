import { useState, useRef, useEffect } from "react";
import { Bell, Settings2, X, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface NotificationSettingsPopupProps {
  isAuthenticated: boolean;
  onLoginRequired: () => void;
}

export function NotificationSettingsPopup({
  isAuthenticated,
  onLoginRequired,
}: NotificationSettingsPopupProps) {
  const [open, setOpen] = useState(false);
  const [aviso1, setAviso1] = useState<number>(1440);
  const [aviso2, setAviso2] = useState<number>(0);
  const [saved, setSaved] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      toast.error("Erro ao salvar: " + err.message);
    },
  });

  // Fechar ao clicar fora (desktop dropdown)
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Bloquear scroll do body quando modal mobile está aberto
  useEffect(() => {
    if (open && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

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

  const getAvisoLabel = (minutes: number) => {
    const opt = ANTECEDENCIA_OPTIONS.find(o => o.value === minutes);
    return opt ? opt.label : `${minutes}min`;
  };

  // Conteúdo interno do popup (reutilizado em mobile e desktop)
  const PopupContent = () => (
    <>
      {/* Header do popup */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-800/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-sm">Agendamento de Avisos</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Corpo do popup */}
      <div className="p-4 space-y-4 overflow-y-auto">
        <p className="text-xs text-slate-400 leading-relaxed">
          Configure com quantas horas de antecedência deseja receber avisos push antes de cada voo.
          Defina como <strong className="text-slate-300">Desativado</strong> para não receber aquele aviso.
        </p>

        {/* Aviso 1 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">1</div>
            <label className="text-sm font-medium text-slate-200">Aviso 1</label>
            {aviso1 > 0 && (
              <span className="ml-auto text-xs text-blue-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getAvisoLabel(aviso1)}
              </span>
            )}
          </div>
          <Select
            value={String(aviso1)}
            onValueChange={(v) => setAviso1(Number(v))}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white z-[9999]">
              {ANTECEDENCIA_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={String(opt.value)}
                  className="text-sm hover:bg-slate-700 focus:bg-slate-700"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aviso 2 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">2</div>
            <label className="text-sm font-medium text-slate-200">Aviso 2</label>
            {aviso2 > 0 && (
              <span className="ml-auto text-xs text-orange-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getAvisoLabel(aviso2)}
              </span>
            )}
          </div>
          <Select
            value={String(aviso2)}
            onValueChange={(v) => setAviso2(Number(v))}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white z-[9999]">
              {ANTECEDENCIA_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={String(opt.value)}
                  className="text-sm hover:bg-slate-700 focus:bg-slate-700"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resumo */}
        {(aviso1 > 0 || aviso2 > 0) && (
          <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 space-y-1.5">
            <p className="text-xs text-slate-400 font-medium">Avisos ativos:</p>
            {aviso1 > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                Aviso 1: <span className="text-blue-400 font-medium">{getAvisoLabel(aviso1)}</span> antes do voo
              </div>
            )}
            {aviso2 > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                Aviso 2: <span className="text-orange-400 font-medium">{getAvisoLabel(aviso2)}</span> antes do voo
              </div>
            )}
          </div>
        )}

        {/* Botão Salvar */}
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateMutation.isPending ? (
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
    </>
  );

  return (
    <>
      {/* Botão no cabeçalho */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpen}
          title="Configurar agendamentos de notificação"
          className="flex items-center gap-1.5 text-xs h-8 px-2.5 text-slate-300 hover:text-white hover:bg-white/10"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Avisos</span>
        </Button>

        {/* Dropdown — apenas em telas ≥ sm (640px) */}
        {open && (
          <div
            className="hidden sm:block absolute right-0 top-10 z-50 w-80 rounded-xl shadow-2xl border border-white/10 bg-slate-900 text-white overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
          >
            <PopupContent />
          </div>
        )}
      </div>

      {/* Modal centralizado — apenas em telas < sm (mobile) */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay escuro */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Card centralizado */}
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl border border-white/10 bg-slate-900 text-white overflow-hidden"
            style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.7)" }}
          >
            <PopupContent />
          </div>
        </div>
      )}
    </>
  );
}
