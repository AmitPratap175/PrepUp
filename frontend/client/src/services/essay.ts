import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface EssayTopic {
    id: string;
    title: string;
    description: string;
    domain: string;
    difficulty: "easy" | "medium" | "hard";
    context: string;
    key_points: string[];
    created_at: string;
}

export interface XATEssayQuestion {
    id: string;
    qid: string;
    passage_text: string | null;
    question_text: string;
    solution_text: string | null;
}

export interface Essay {
    id: string;
    title: string;
    content: string;
    topic_id?: string;
    topic_title?: string;
    xat_question_id?: string;
    word_count: number;
    time_spent: number;
    status: "draft" | "submitted" | "reviewed";
    created_at: string;
    updated_at: string;
    submitted_at?: string;
}

export interface EssayReview {
    overall_score: number;
    structure_score: number;
    coherence_score: number;
    arguments_score: number;
    language_score: number;
    detailed_feedback: {
        strengths: string[];
        weaknesses: string[];
        structure_analysis: string;
        coherence_analysis: string;
        arguments_analysis: string;
        language_analysis: string;
    };
    improvement_suggestions: string[];
    reviewed_at: string;
}

// --- Topic Hooks ---

export function useEssayTopics(domain?: string, difficulty?: string) {
    return useQuery<EssayTopic[]>({
        queryKey: ["essay-topics", domain, difficulty],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (domain) params.append("domain", domain);
            if (difficulty) params.append("difficulty", difficulty);
            const res = await apiRequest("GET", `/api/essays/topics/?${params.toString()}`);
            const data = await res.json();
            return data.topics;
        },
    });
}

export function useGenerateEssayTopics() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ domain, count = 3 }: { domain: string; count?: number }) => {
            const res = await apiRequest("POST", "/api/essays/topics/generate/", { domain, count });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["essay-topics"] });
        },
    });
}

// --- Essay Hooks ---

export function useEssays(status?: string) {
    return useQuery<Essay[]>({
        queryKey: ["essays", status],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (status) params.append("status", status);
            const res = await apiRequest("GET", `/api/essays/?${params.toString()}`);
            const data = await res.json();
            return data.essays;
        },
    });
}

export function useEssay(id: string) {
    return useQuery<Essay>({
        queryKey: ["essay", id],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/essays/${id}/`);
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateEssay() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { title: string; topic_id?: string; xat_question_id?: string; content?: string }) => {
            const res = await apiRequest("POST", "/api/essays/", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["essays"] });
        },
    });
}

export function useUpdateEssay() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Essay> }) => {
            const res = await apiRequest("PUT", `/api/essays/${id}/`, data);
            return res.json();
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["essay", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["essays"] });
        },
    });
}

export function useSubmitEssay() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await apiRequest("POST", `/api/essays/${id}/submit/`);
            return res.json();
        },
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: ["essay", id] });
            queryClient.invalidateQueries({ queryKey: ["essays"] });
        },
    });
}

export function useEssayReview(essayId: string) {
    return useQuery<EssayReview>({
        queryKey: ["essay-review", essayId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/essays/${essayId}/review/`);
            return res.json();
        },
        enabled: !!essayId,
        retry: false, // Don't retry if review is not found (404)
    });
}
