import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PracticeTest from "@/pages/practice-test";
import Dashboard from "@/pages/dashboard";
import StudyMaterials from "@/pages/study-materials";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/practice-test/:testId?" component={PracticeTest} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/study-materials" component={StudyMaterials} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
