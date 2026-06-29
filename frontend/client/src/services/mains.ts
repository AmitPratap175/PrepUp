import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface MainsQuestion {
    id: string;
    gs_paper: number;
    syllabus_topic: string;
    question_text: string;
    model_answer?: string;
    key_points: string[];
}

export interface MainsEvaluation {
    id: string;
    question_id: string;
    question_text: string;
    gs_paper: number;
    user_answer: string;
    intro_score: number;
    body_score: number;
    conclusion_score: number;
    structure_score: number;
    overall_score: number;
    factual_feedback: string[];
    structural_feedback: string;
    model_answer: string;
    evaluated_at: string;
}

export interface MainsEvaluationSummary {
    id: string;
    question_id: string;
    question_text: string;
    gs_paper: number;
    overall_score: number;
    evaluated_at: string;
}

export function useMainsQuestions(gsPaper?: number) {
    return useQuery<{ questions: MainsQuestion[] }>({
        queryKey: ["mains-questions", gsPaper],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (gsPaper !== undefined) params.append("gs_paper", gsPaper.toString());
            const res = await apiRequest("GET", `/api/upsc/mains/questions/?${params.toString()}`);
            return res.json();
        },
    });
}

export function useMainsQuestion(questionId: string) {
    return useQuery<MainsQuestion>({
        queryKey: ["mains-question", questionId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/upsc/mains/questions/${questionId}/`);
            return res.json();
        },
        enabled: !!questionId,
    });
}

export function useEvaluateMainsAnswer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ questionId, userAnswer }: { questionId: string; userAnswer: string }) => {
            const res = await apiRequest("POST", `/api/upsc/mains/questions/${questionId}/evaluate/`, {
                user_answer: userAnswer,
            });
            return res.json() as Promise<Omit<MainsEvaluation, "user_answer" | "question_id" | "question_text" | "gs_paper"> & { evaluation_id: string }>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mains-evaluations"] });
        },
    });
}

export function useMainsEvaluations() {
    return useQuery<{ evaluations: MainsEvaluationSummary[] }>({
        queryKey: ["mains-evaluations"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/upsc/mains/evaluations/");
            return res.json();
        },
    });
}

export function useMainsEvaluation(evaluationId: string) {
    return useQuery<MainsEvaluation>({
        queryKey: ["mains-evaluation", evaluationId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/upsc/mains/evaluations/${evaluationId}/`);
            return res.json();
        },
        enabled: !!evaluationId,
    });
}
