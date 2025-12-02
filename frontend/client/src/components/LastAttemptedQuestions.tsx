import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LastAttemptedQuestions({ userQuizStates, testIdToDataMap }: { userQuizStates: any[] | undefined, testIdToDataMap: Map<string, { title: string, type: 'quiz' | 'sectional' | 'mock' }> }) {
  if (!userQuizStates || userQuizStates.length === 0) {
    return null;
  }

  const getLink = (testId: string, type?: 'quiz' | 'sectional' | 'mock') => {
    switch (type) {
      case 'quiz':
        return `/quiz?testId=${testId}`;
      case 'sectional':
        return `/sectional-test/${testId}`;
      case 'mock':
        return `/mock-test/${testId}`;
      default:
        return `/quiz?testId=${testId}`;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Continue Where You Left Off</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userQuizStates.map((quizState) => {
            const testData = testIdToDataMap.get(quizState.test_id);
            const title = testData?.title || quizState.test_id;
            const type = testData?.type;
            const link = getLink(quizState.test_id, type);

            return (
              <Link key={quizState.test_id} href={link}>
                <a className="block p-3 bg-muted/50 rounded-lg hover:bg-muted">
                  <div className="font-medium text-foreground">{title}</div>
                  <div className="text-sm text-muted-foreground">
                    Last attempted question: {quizState.last_question_index + 1}
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
