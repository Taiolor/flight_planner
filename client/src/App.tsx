import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { YearProvider } from "./contexts/YearContext";
import Home from "./pages/Home";
import { Toaster } from "sonner";

// Code splitting: carrega CalendarView, AdminNotifications e FlightQuotes apenas quando necessário
const CalendarView = lazy(() => import("./pages/CalendarView"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const FlightQuotes = lazy(() => import("./pages/FlightQuotes"));

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
      <Route path={"/"} component={Home} />
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
      <Route path={"/cotacoes"}>
        <Suspense fallback={<PageLoader />}>
          <FlightQuotes />
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
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </YearProvider>
    </ErrorBoundary>
  );
}

export default App;
