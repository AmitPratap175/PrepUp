import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "wouter";

/**
 * @interface Word
 * Represents a saved word with its meaning and context.
 */
interface Word {
  id: string;
  word: string;
  meaning: string;
  context: string;
  question_id: string;
}

/**
 * A page that displays the user's saved words.
 *
 * This component fetches all of the user's saved words from the API and
 * displays them in a list.
 *
 * @returns {JSX.Element} The rendered words page.
 */
export default function WordsPage() {
  const { isAuthenticated } = useAuth();

  const { data: words, isLoading } = useQuery<Word[]>({
    queryKey: ["words"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }
      const response = await fetch(`/api/auth/words/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch words");
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">
              Loading your saved words...
            </div>
            <div className="text-muted-foreground">Please wait</div>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              My Words
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Review the words you've saved, along with their meanings and the
              context in which you found them.
            </p>
          </div>

          {words && words.length > 0 ? (
            <div className="space-y-6">
              {words.map((word) => (
                <Card key={word.id} className="hover:shadow-md transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">
                      {word.word}
                    </CardTitle>
                    <CardDescription className="italic">
                      "{word.context}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{word.meaning}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">
                  menu_book
                </span>
                <h3 className="text-xl font-semibold mb-2">
                  No Words Saved Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  You haven't saved any words yet. Start highlighting words in quizzes to save them here.
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