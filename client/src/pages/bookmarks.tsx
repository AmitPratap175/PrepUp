import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { NewQuizInterface } from "@/components/NewQuizInterface";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PracticeTest, Question, Bookmark } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "wouter";

interface BookmarkedQuestions {
  [subject: string]: Question[];
}

export default function BookmarksPage() {
  const { isAuthenticated } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const { data: bookmarks, isLoading: isLoadingBookmarks } = useQuery<Bookmark[]>({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch(`http://${window.location.hostname}:8000/api/auth/bookmarks/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch bookmarks");
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const { data: practiceTests, isLoading: isLoadingPracticeTests } = useQuery<PracticeTest[]>({
    queryKey: ["/api/practice-tests"],
  });

  const [bookmarkedQuestions, setBookmarkedQuestions] =
    useState<BookmarkedQuestions>({});

  useEffect(() => {
    if (bookmarks && practiceTests) {
      const groupedBookmarks: BookmarkedQuestions = bookmarks.reduce(
        (acc, bookmark) => {
          const { subject, question_id } = bookmark;
          const test = practiceTests.find(p => p.subject === subject);
          if (test) {
            const question = (test.questions as Question[]).find(q => q.qid === question_id);
            if (question) {
              if (!acc[subject]) {
                acc[subject] = [];
              }
              acc[subject].push(question);
            }
          }
          return acc;
        },
        {} as BookmarkedQuestions
      );
      setBookmarkedQuestions(groupedBookmarks);
    }
  }, [bookmarks, practiceTests]);

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (isLoadingBookmarks || isLoadingPracticeTests) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">
              Loading bookmarks...
            </div>
            <div className="text-muted-foreground">Please wait</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (selectedSubject && bookmarkedQuestions[selectedSubject]) {
    const test: PracticeTest = {
      id: selectedSubject,
      title: `${selectedSubject} Bookmarks`,
      examType: "",
      subject: selectedSubject,
      duration: 0,
      totalQuestions: bookmarkedQuestions[selectedSubject].length,
      questions: bookmarkedQuestions[selectedSubject],
    };
    return (
      <NewQuizInterface
        test={test}
        onExit={() => setSelectedSubject(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Bookmarked Questions
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Review your bookmarked questions by subject.
            </p>
          </div>

          {Object.keys(bookmarkedQuestions).length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(bookmarkedQuestions).map(([subject, questions]) => (
                <Card
                  key={subject}
                  className="hover:shadow-lg transition-all duration-300 hover-elevate"
                >
                  <CardHeader>
                    <CardTitle className="text-xl">{subject}</CardTitle>
                    <CardDescription>
                      {questions.length} questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => setSelectedSubject(subject)}
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">
                  bookmark
                </span>
                <h3 className="text-xl font-semibold mb-2">
                  No Bookmarks Found
                </h3>
                <p className="text-muted-foreground mb-6">
                  You haven't bookmarked any questions yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
