import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import FlyIA from "./components/FlyIA";
import PerformanceTelemetry from "./components/PerformanceTelemetry";
import UsageTelemetry from "./components/UsageTelemetry";
import { MobileBottomNavigation } from "./components/MobileBottomNavigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import { YearProvider } from "./contexts/YearContext";
import Home from "./pages/Home";
import { Toaster } from "sonner";

// Code splitting: carrega CalendarView, AdminNotifications, FlightQuotes, Changelog e FinancialDashboard apenas quando necessário
const CalendarView = lazy(() => import("./pages/CalendarView"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const FlightQuotes = lazy(() => import("./pages/FlightQuotes"));
const Changelog = lazy(() => import("./pages/Changelog"));
const FinancialDashboard = lazy(() => import("./pages/FinancialDashboard"));
const UsageTelemetryMap = lazy(() => import("./pages/UsageTelemetryMap"));
const GeminiBudgetDashboard = lazy(() => import("./pages/GeminiBudgetDashboard"));
const Memories = lazy(() => import("./pages/Memories"));
const PassageManagementPage = lazy(() => import("./pages/PassageManagementPage"));

// Fallback de carregamento para rotas com lazy loading
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Carregando...</span>
      </div>
    </div>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"}>
        <Home />
      </Route>
      <Route path={"/gestao-passagens"}>
        <Suspense fallback={<PageLoader />}>
          <PassageManagementPage />
        </Suspense>
      </Route>
      <Route path={"/calendar"}>
        <Suspense fallback={<PageLoader />}>
          <CalendarView />
        </Suspense>
      </Route>
      <Route path={"/admin/notifications"}>
        <Suspense fallback={<PageLoader />}>
          <AdminNotifications />
        </Suspense>
      </Route>
      <Route path={"/admin/telemetria"}>
        <Suspense fallback={<PageLoader />}>
          <UsageTelemetryMap />
        </Suspense>
      </Route>
      <Route path={"/admin/gemini"}>
        <Suspense fallback={<PageLoader />}>
          <GeminiBudgetDashboard />
        </Suspense>
      </Route>
      <Route path={"/cotacoes"}>
        <Suspense fallback={<PageLoader />}>
          <FlightQuotes />
        </Suspense>
      </Route>
      <Route path={"/novidades"}>
        <Suspense fallback={<PageLoader />}>
          <Changelog />
        </Suspense>
      </Route>
      <Route path={"/financeiro"}>
        <Suspense fallback={<PageLoader />}>
          <FinancialDashboard />
        </Suspense>
      </Route>
      <Route path={"/memorias"}>
        <Suspense fallback={<PageLoader />}>
          <Memories />
        </Suspense>
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <YearProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster position="top-right" richColors />
            <PerformanceTelemetry />
            <UsageTelemetry />
            <div className="pb-24 sm:pb-0">
              <Router />
            </div>
            <MobileBottomNavigation />
            <FlyIA />
          </TooltipProvider>
        </ThemeProvider>
      </YearProvider>
    </ErrorBoundary>
  );
}

export default App;
