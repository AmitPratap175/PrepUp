import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PracticeTest from "@/pages/practice-test";
import QuizPage from "@/pages/quiz";
import Dashboard from "@/pages/dashboard";
import StudyMaterials from "@/pages/study-materials";
import Courses from "@/pages/courses";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Help from "@/pages/help";
import Careers from "@/pages/careers";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Cookies from "@/pages/cookies";
import Refund from "@/pages/refund";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import BookmarksPage from "@/pages/bookmarks";
import { AuthProvider } from "@/contexts/auth-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/practice-test/:testId?" component={PracticeTest} />
      <Route path="/quiz/:testId?" component={QuizPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/study-materials" component={StudyMaterials} />
      <Route path="/courses" component={Courses} />
      <Route path="/bookmarks" component={BookmarksPage} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/help" component={Help} />
      <Route path="/careers" component={Careers} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/refund" component={Refund} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
