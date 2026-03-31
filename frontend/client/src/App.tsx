import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PracticeTest from "@/pages/practice-test";
import MockTestsPage from "@/pages/mock-tests";
import MockTestPage from "@/pages/mock-test";
import MockTestResultPage from "@/pages/mock-test-result";
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
import WordsPage from "@/pages/words";
import CurrentAffairsPage from "@/pages/current-affairs";
import CurrentAffairsArticlePage from "@/pages/current-affairs-article";
import SectionalTestsPage from "@/pages/sectional-tests";
import SectionalTestPage from "@/pages/sectional-test-page";
import SectionalTestResultPage from "@/pages/sectional-test-result";
import PracticeTestResultPage from "@/pages/practice-test-result";
import { AuthProvider } from "@/contexts/auth-context";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import AddQuestionPage from "@/pages/AddQuestion";
import SettingsPage from "./pages/Settings";
import SopForgePage from "@/pages/sopforge";
import SmartPracticePage from "@/pages/smart-practice";
import LeaderboardPage from "@/pages/leaderboard";
import AnalyticsDashboardPage from "@/pages/analytics-dashboard";
import BadgesPage from "@/pages/badges";
import XatEssayPage from "@/pages/xat-essay";
import DailyTargetsPage from "@/pages/daily-targets";
import DailyTargetsSettingsPage from "@/pages/daily-targets/settings";
import DailyTargetTestInterface from "@/pages/daily-targets/test-interface";
import DailyTargetRevision from "@/pages/daily-targets/revision";
import DailyTargetResultPage from "@/pages/daily-targets/result";
import UPSCPage from "@/pages/upsc";
import UPSCQuizPage from "@/pages/upsc/quiz";
import UPSCResultPage from "@/pages/upsc/result";
import UPSCRevisionPage from "@/pages/upsc/revision";
import QuizGeneratorPage from "@/pages/generated-quiz";
import GeneratedQuizViewerPage from "@/pages/generated-quiz-viewer";
import ChapterwiseQuizPage from "@/pages/chapterwise-quiz";
import NcertTopicwiseQuizPage from "@/pages/ncert-topicwise-quiz";
import UPSCPYQTopicsPage from "@/pages/upsc/pyq-topics";
import UPSCBookmarksPage from "@/pages/upsc-bookmarks";
import { useEffect } from "react";
import { useStudyTracker } from "./hooks/useStudyTracker";
import UPSCYearWisePage from "@/pages/upsc/pyq-years";
import UPSCReviewMistakesPage from "@/pages/upsc/review-mistakes";
import PIBListPage from "@/pages/pib/list";
import PIBDetailPage from "@/pages/pib/detail";
import PIBQuizPage from "@/pages/pib/quiz";
import MainsAnswerPage from "@/pages/mains-answer";

/**
 * Defines the main routing configuration for the application.
 *
 * This component uses `wouter` to map URL paths to their corresponding page components,
 * covering all major sections of the application from static pages to dynamic quiz
  * and test interfaces.
 *
 * @returns { JSX.Element } The router switch component.
 */
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/practice-test/result/:testId" component={PracticeTestResultPage} />
      <Route path="/practice-test/:testId?" component={PracticeTest} />
      <Route path="/mock-tests" component={MockTestsPage} />
      <Route path="/mock-test/result/:testId" component={MockTestResultPage} />
      <Route path="/mock-test/:testId" component={MockTestPage} />
      <Route path="/sectional-tests" component={SectionalTestsPage} />
      <Route path="/sectional-test/:id" component={SectionalTestPage} />
      <Route path="/sectional-test/result/:testId" component={SectionalTestResultPage} />
      <Route path="/quiz/:testId?" component={QuizPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/study-materials" component={StudyMaterials} />
      <Route path="/courses" component={Courses} />
      <Route path="/bookmarks" component={BookmarksPage} />
      <Route path="/words" component={WordsPage} />
      <Route path="/current-affairs" component={CurrentAffairsPage} />
      <Route path="/current-affairs/:articleId" component={CurrentAffairsArticlePage} />
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
      <Route path="/add-question" component={AddQuestionPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/sop-forge" component={SopForgePage} />
      <Route path="/smart-practice" component={SmartPracticePage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/analytics" component={AnalyticsDashboardPage} />
      <Route path="/badges" component={BadgesPage} />
      <Route path="/badges" component={BadgesPage} />
      <Route path="/xat-essay/:essayId?" component={XatEssayPage} />
      <Route path="/daily-targets" component={DailyTargetsPage} />
      <Route path="/daily-targets/settings" component={DailyTargetsSettingsPage} />
      <Route path="/daily-targets/test/:subject" component={DailyTargetTestInterface} />
      <Route path="/daily-targets/result/:targetId" component={DailyTargetResultPage} />
      <Route path="/daily-targets/revision" component={DailyTargetRevision} />

      import UPSCReviewMistakesPage from "@/pages/upsc/review-mistakes";

      // ... (inside Router switch)
      <Route path="/upsc" component={UPSCPage} />
      <Route path="/upsc/topics" component={UPSCPYQTopicsPage} />
      <Route path="/upsc/years" component={UPSCYearWisePage} />
      <Route path="/upsc/review/:sessionId" component={UPSCReviewMistakesPage} />
      <Route path="/upsc/test/:id" component={UPSCQuizPage} />
      <Route path="/upsc/result/:sessionId" component={UPSCResultPage} />
      <Route path="/upsc/revision" component={UPSCRevisionPage} />
      <Route path="/upsc/bookmarks" component={UPSCBookmarksPage} />
      <Route path="/upsc/pib" component={PIBListPage} />
      <Route path="/upsc/pib/:id" component={PIBDetailPage} />
      <Route path="/upsc/pib/:id/quiz" component={PIBQuizPage} />
      <Route path="/mains-answer/:essayId?" component={MainsAnswerPage} />
      <Route path="/quiz-generator" component={QuizGeneratorPage} />
      <Route path="/generated-quiz/:id" component={GeneratedQuizViewerPage} />
      <Route path="/chapterwise-quiz" component={ChapterwiseQuizPage} />
      <Route path="/ncert-topicwise-quiz" component={NcertTopicwiseQuizPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * The main application component.
 *
 * This component applies global settings such as theme and text size, and it
 * renders the main router and the toaster for notifications.
 *
 * @returns {JSX.Element} The main application layout.
 */
function App() {
  const { settings } = useSettings();
  useStudyTracker();

  useEffect(() => {
    if (settings) {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(settings.theme);

      // remove all text size classes
      root.classList.forEach(className => {
        if (className.startsWith('text-')) {
          root.classList.remove(className);
        }
      });
      root.classList.add(`text-${settings.text_size}`);

    }
  }, [settings]);

  return (
    <>
      <Toaster />
      <Router />
    </>
  );
}

/**
 * A wrapper component that provides all necessary contexts to the application.
 *
 * This component wraps the main `App` with providers for React Query, tooltips,
 * authentication, and settings, ensuring that these contexts are available
 * to all child components.
 *
 * @returns {JSX.Element} The application wrapped in context providers.
 */
function WrappedApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default WrappedApp;
