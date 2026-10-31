import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[radial-gradient(circle_at_top,_#102f61_0%,_#071a36_42%,_#020617_100%)] px-4 py-10 text-white">
      <Card className="w-full max-w-lg border border-white/15 bg-white/95 text-slate-950 shadow-2xl shadow-black/30 backdrop-blur-sm">
        <CardContent className="pb-8 pt-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="grid size-16 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              <AlertTriangle className="size-8" aria-hidden="true" />
            </div>
          </div>

          <p className="mb-2 text-sm font-bold tracking-[0.18em] text-[#17427e]">ERRO 404</p>

          <h1 className="mb-4 text-2xl font-bold text-[#071a36]">
            Página não encontrada
          </h1>

          <p className="mb-8 leading-relaxed text-slate-600">
            O endereço acessado não existe ou foi movido.
            <br />
            Volte ao planejamento para continuar organizando suas viagens.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="rounded-xl bg-[#071a36] px-6 py-2.5 text-white shadow-md transition-all duration-200 hover:bg-[#102f61] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[#315c99] focus-visible:ring-offset-2"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
