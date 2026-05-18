import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/context/auth-context";

import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Addiction from "@/pages/addiction";
import BodyDoubling from "@/pages/body-doubling";
import Report from "@/pages/report";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Journal from "@/pages/journal";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) setLocation("/login");
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <Layout>{children}</Layout>;
}

function OnboardingGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { setLocation("/login"); return; }
    if (user?.onboardingComplete) { setLocation("/dashboard"); return; }
  }, [isLoading, isAuthenticated, user?.onboardingComplete]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0E1A" }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.onboardingComplete) return null;

  return <Onboarding />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/">
        <OnboardingGuard />
      </Route>
      <Route>
        <ProtectedLayout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/addiction" component={Addiction} />
            <Route path="/body-doubling" component={BodyDoubling} />
            <Route path="/report" component={Report} />
            <Route path="/journal" component={Journal} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </ProtectedLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
