/**
 * @typedef {string} SubjectType
 * Represents the subject of a question or test.
 */
export type SubjectType = string;

/**
 * @interface Option
 * Defines the structure of a single option for a multiple-choice question.
 * @property {string} data_option - The unique identifier for the option.
 * @property {string} label - The label for the option (e.g., 'A', 'B').
 * @property {string} option_text - The text content of the option.
 * @property {boolean} is_correct - True if this is the correct option.
 */
export interface Option {
  data_option: string;
  label: string;
  option_text: string;
  is_correct: boolean;
}

/**
 * @interface Question
 * Defines the structure of a single quiz or test question.
 * @property {string} qid - The unique identifier for the question.
 * @property {string | null} passage_text - An optional passage associated with the question.
 * @property {string} question_text - The main text of the question.
 * @property {Option[]} options - An array of options for multiple-choice questions.
 * @property {string} correct_option_data - The data for the correct option, used for non-MCQ questions.
 * @property {string | null} solution_text - An optional detailed solution or explanation.
 * @property {string | string[] | null} image_url - URL(s) for any images associated with the question.
 * @property {string} full_markdown - The complete markdown source for the question, if available.
 */
export interface Question {
  qid: string;
  passage_text: string | null;
  question_text: string;
  options: Option[];
  correct_option_data: string;
  solution_text: string | null;
  image_url: string | string[] | null;
  full_markdown: string;
}
