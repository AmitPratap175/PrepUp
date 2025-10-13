/**
 * @interface NavigationItem
 * Defines the structure for a navigation link, which can also contain sub-items.
 * @property {string} title - The display text for the navigation link.
 * @property {string} href - The URL path for the link.
 * @property {NavigationItem[]} [items] - An optional array of sub-navigation items.
 */
export interface NavigationItem {
  title: string;
  href: string;
  items?: NavigationItem[];
}

/**
 * @interface TestState
 * Represents the complete state of a test in progress.
 * @property {number} currentQuestionIndex - The index of the currently displayed question.
 * @property {Record<string, string | null>} answers - A map of question IDs to the user's selected answers.
 * @property {Set<string>} markedForReview - A set of question IDs that the user has marked for review.
 * @property {number} timeRemaining - The time left for the test, in seconds.
 * @property {boolean} isCompleted - A flag indicating whether the test has been completed.
 */
export interface TestState {
  currentQuestionIndex: number;
  answers: Record<string, string | null>;
  markedForReview: Set<string>;
  timeRemaining: number;
  isCompleted: boolean;
  startTime?: number;
}

/**
 * @interface QuestionStatus
 * Describes the current status of a single question in the test palette.
 * @property {boolean} answered - True if the user has answered the question.
 * @property {boolean} visited - True if the user has visited the question.
 * @property {boolean} markedForReview - True if the user has marked the question for review.
 * @property {boolean} isCurrent - True if this is the currently displayed question.
 */
export interface QuestionStatus {
  answered: boolean;
  visited: boolean;
  markedForReview: boolean;
  isCurrent: boolean;
}
