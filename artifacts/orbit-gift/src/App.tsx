import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Shell } from '@/components/shell';
import NotFound from '@/pages/not-found';
import Keepers from '@/pages/keepers';
import RecipientNew from '@/pages/recipient-new';
import LovePage from '@/pages/love';
import RefusalsPage from '@/pages/refusals';
import ResultsPage from '@/pages/results';
import SharePage from '@/pages/share';
import CompletePage from '@/pages/complete';

const queryClient = new QueryClient();

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  const [location] = useLocation();
  // The completion page stands alone: no shell, no saved data, no settings.
  if (location === '/complete') {
    return (
      <RoutedErrorBoundary>
        <CompletePage />
      </RoutedErrorBoundary>
    );
  }
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Keepers} />
          <Route path="/recipient/new" component={RecipientNew} />
          <Route path="/recipient/:id/love" component={LovePage} />
          <Route path="/recipient/:id/refusals" component={RefusalsPage} />
          <Route path="/recipient/:id/results" component={ResultsPage} />
          <Route path="/share" component={SharePage} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
