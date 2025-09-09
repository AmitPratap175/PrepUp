export interface NavigationItem {
  title: string;
  href: string;
  items?: NavigationItem[];
}

export interface TestState {
  currentQuestionIndex: number;
  answers: Record<string, string | null>;
  markedForReview: Set<string>;
  timeRemaining: number;
  isCompleted: boolean;
}

export interface QuestionStatus {
  answered: boolean;
  visited: boolean;
  markedForReview: boolean;
  isCurrent: boolean;
}
