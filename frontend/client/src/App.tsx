import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home"));
const PracticeTest = lazy(() => import("@/pages/practice-test"));
const MockTestsPage = lazy(() => import("@/pages/mock-tests"));
const MockTestPage = lazy(() => import("@/pages/mock-test"));
const MockTestResultPage = lazy(() => import("@/pages/mock-test-result"));
const QuizPage = lazy(() => import("@/pages/quiz"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const StudyMaterials = lazy(() => import("@/pages/study-materials"));
const Courses = lazy(() => import("@/pages/courses"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Help = lazy(() => import("@/pages/help"));
const Careers = lazy(() => import("@/pages/careers"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const Cookies = lazy(() => import("@/pages/cookies"));
const Refund = lazy(() => import("@/pages/refund"));
const LoginPage = lazy(() => import("@/pages/login"));
const SignupPage = lazy(() => import("@/pages/signup"));
const BookmarksPage = lazy(() => import("@/pages/bookmarks"));
const WordsPage = lazy(() => import("@/pages/words"));
const CurrentAffairsPage = lazy(() => import("@/pages/current-affairs"));
const CurrentAffairsArticlePage = lazy(() => import("@/pages/current-affairs-article"));
const SectionalTestsPage = lazy(() => import("@/pages/sectional-tests"));
const SectionalTestPage = lazy(() => import("@/pages/sectional-test-page"));
const SectionalTestResultPage = lazy(() => import("@/pages/sectional-test-result"));
const PracticeTestResultPage = lazy(() => import("@/pages/practice-test-result"));
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
const AddQuestionPage = lazy(() => import("@/pages/AddQuestion"));
import SettingsPage from "./pages/Settings";
const SopForgePage = lazy(() => import("@/pages/sopforge"));
const SmartPracticePage = lazy(() => import("@/pages/smart-practice"));
const LeaderboardPage = lazy(() => import("@/pages/leaderboard"));
const AnalyticsDashboardPage = lazy(() => import("@/pages/analytics-dashboard"));
const BadgesPage = lazy(() => import("@/pages/badges"));
const XatEssayPage = lazy(() => import("@/pages/xat-essay"));
const DailyTargetsPage = lazy(() => import("@/pages/daily-targets"));
const DailyTargetsSettingsPage = lazy(() => import("@/pages/daily-targets/settings"));
const DailyTargetTestInterface = lazy(() => import("@/pages/daily-targets/test-interface"));
const DailyTargetRevision = lazy(() => import("@/pages/daily-targets/revision"));
const DailyTargetResultPage = lazy(() => import("@/pages/daily-targets/result"));
const UPSCPage = lazy(() => import("@/pages/upsc"));
const UPSCQuizPage = lazy(() => import("@/pages/upsc/quiz"));
const UPSCResultPage = lazy(() => import("@/pages/upsc/result"));
const UPSCRevisionPage = lazy(() => import("@/pages/upsc/revision"));
const QuizGeneratorPage = lazy(() => import("@/pages/generated-quiz"));
const GeneratedQuizViewerPage = lazy(() => import("@/pages/generated-quiz-viewer"));
const ChapterwiseQuizPage = lazy(() => import("@/pages/chapterwise-quiz"));
const NcertTopicwiseQuizPage = lazy(() => import("@/pages/ncert-topicwise-quiz"));
const DailyPracticeQuestionsPage = lazy(() => import("@/pages/daily-practice-questions"));
const MonthlyMcqQuestionsPage = lazy(() => import("@/pages/monthly-mcq-questions"));
const UPSCPYQTopicsPage = lazy(() => import("@/pages/upsc/pyq-topics"));
const UPSCBookmarksPage = lazy(() => import("@/pages/upsc-bookmarks"));
const OdishaTopicwisePracticePage = lazy(() => import("@/pages/odisha-topicwise-practice"));
const DailyRevisionPage = lazy(() => import("@/pages/daily-revision"));
const SSCPage = lazy(() => import("@/pages/ssc/index"));
const SSCQuizPage = lazy(() => import("@/pages/ssc/quiz"));
const SSCResultPage = lazy(() => import("@/pages/ssc/result"));
const SSCYearWisePage = lazy(() => import("@/pages/ssc/pyq-years"));
const SSCBookmarksPage = lazy(() => import("@/pages/ssc/bookmarks"));
import { useEffect, useState } from "react";
import { lazy, Suspense } from "react";
import { useStudyTracker } from "./hooks/useStudyTracker";
import { Chatbot } from "@/components/chatbot";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
const UPSCYearWisePage = lazy(() => import("@/pages/upsc/pyq-years"));
const UPSCReviewMistakesPage = lazy(() => import("@/pages/upsc/review-mistakes"));
const PIBListPage = lazy(() => import("@/pages/pib/list"));
const PIBDetailPage = lazy(() => import("@/pages/pib/detail"));
const PIBQuizPage = lazy(() => import("@/pages/pib/quiz"));
const MainsAnswerPage = lazy(() => import("@/pages/mains-answer"));
const MapMasterPage = lazy(() => import("@/pages/map-master"));
const EssaysListPage = lazy(() => import("@/pages/upsc/essays-list"));
const EssayDailyReadPage = lazy(() => import("@/pages/upsc/essay-daily-read"));
const MathEvaluationPage = lazy(() => import("@/pages/upsc/math-evaluation"));
const UPSCMastery2027Page = lazy(() => import("@/pages/upsc/mastery-2027/App"));
const UPSC2027TestSeriesList = lazy(() => import("@/pages/upsc/test-series-2027-list"));
const UPSC2027TestTakePage = lazy(() => import("@/pages/upsc/test-series-2027-take"));
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
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

      <Route path="/upsc" component={UPSCPage} />
      <Route path="/upsc/topics" component={UPSCPYQTopicsPage} />
      <Route path="/upsc/years" component={UPSCYearWisePage} />
      <Route path="/upsc/review/:sessionId" component={UPSCReviewMistakesPage} />
      <Route path="/upsc/test/:id" component={UPSCQuizPage} />
      <Route path="/upsc/2027-tests" component={UPSC2027TestSeriesList} />
      <Route path="/upsc/2027-tests/:id" component={UPSC2027TestTakePage} />
      <Route path="/upsc/result/:sessionId" component={UPSCResultPage} />
      <Route path="/upsc/revision" component={UPSCRevisionPage} />
      <Route path="/upsc/daily-revision" component={DailyRevisionPage} />
      <Route path="/upsc/bookmarks" component={UPSCBookmarksPage} />
      <Route path="/upsc/pib" component={PIBListPage} />
      <Route path="/upsc/pib/:id" component={PIBDetailPage} />
      <Route path="/upsc/pib/:id/quiz" component={PIBQuizPage} />
      <Route path="/mains-answer/:essayId?" component={MainsAnswerPage} />
      <Route path="/quiz-generator" component={QuizGeneratorPage} />
      <Route path="/generated-quiz/:id" component={GeneratedQuizViewerPage} />
      <Route path="/chapterwise-quiz" component={ChapterwiseQuizPage} />
      <Route path="/ncert-topicwise-quiz" component={NcertTopicwiseQuizPage} />
      <Route path="/upsc/daily-practice-questions" component={DailyPracticeQuestionsPage} />
      <Route path="/upsc/monthly-mcq-questions" component={MonthlyMcqQuestionsPage} />
      <Route path="/upsc/map-master" component={MapMasterPage} />
      <Route path="/upsc/mastery-2027" component={UPSCMastery2027Page} />
      <Route path="/upsc/essays" component={EssaysListPage} />
      <Route path="/upsc/essays/:id" component={EssayDailyReadPage} />
      <Route path="/upsc/math-evaluation" component={MathEvaluationPage} />
      <Route path="/odisha/practice" component={OdishaTopicwisePracticePage} />
      
      {/* SSC Routes */}
      <Route path="/ssc" component={SSCPage} />
      <Route path="/ssc/years" component={SSCYearWisePage} />
      <Route path="/ssc/test/:id" component={SSCQuizPage} />
      <Route path="/ssc/result/:id" component={SSCResultPage} />
      <Route path="/ssc/bookmarks" component={SSCBookmarksPage} />
      <Route component={NotFound} />
      </Switch>
    </Suspense>
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
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

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

  // Determine if we are on a UPSC page
  const isUPSCSection = location.includes('/upsc') || 
                        location.startsWith('/mains-answer') || 
                        location.startsWith('/pib') || 
                        location.startsWith('/quiz-generator') || 
                        location.startsWith('/chapterwise-quiz') || 
                        location.startsWith('/ncert-topicwise-quiz');

  return (
    <>
      <Toaster />
      <Router />
      
      {isAuthenticated && isUPSCSection && (
        <>
          {/* Floating trigger button */}
          <div className="fixed bottom-6 right-6 z-40">
            <Button
              onClick={() => setIsChatbotOpen(!isChatbotOpen)}
              className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all duration-300 hover:scale-105"
              title="Open PrepUp Assistant"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </div>

          {/* Floating Chatbot overlay */}
          {isChatbotOpen && (
            <div className="fixed inset-0 z-50 pointer-events-none">
              <div className="pointer-events-auto">
                <Chatbot onClose={() => setIsChatbotOpen(false)} />
              </div>
            </div>
          )}
        </>
      )}
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
