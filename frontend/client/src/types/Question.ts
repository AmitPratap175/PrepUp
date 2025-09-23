export type SubjectType = string;

export interface Option {
  data_option: string;
  label: string;
  option_text: string;
  is_correct: boolean;
}

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
