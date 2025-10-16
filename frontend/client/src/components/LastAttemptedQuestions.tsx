import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LastAttemptedQuestions({ userQuizStates, testIdToTitleMap }: { userQuizStates: any[] | undefined, testIdToTitleMap: Map<string, string> }) {
  if (!userQuizStates || userQuizStates.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Continue Where You Left Off</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userQuizStates.map((quizState) => (
            <Link key={quizState.test_id} href={`/sectional-test/${quizState.test_id}`}>
              <a className="block p-3 bg-muted/50 rounded-lg hover:bg-muted">
                <div className="font-medium text-foreground">{testIdToTitleMap.get(quizState.test_id) || quizState.test_id}</div>
                <div className="text-sm text-muted-foreground">
                  Last attempted question: {quizState.last_question_index + 1}
                </div>
              </a>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
