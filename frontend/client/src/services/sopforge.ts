const API_URL = "/api";

interface GenerateSopPayload {
  user_prompt: string;
  user_profile: string;
  thread_id?: string;
}

interface SubmitFeedbackPayload {
  thread_id: string;
  feedback: string;
}

export const generateSop = async (payload: GenerateSopPayload) => {
  const response = await fetch(`${API_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to generate SOP");
  }

  return response.json();
};

export const submitFeedback = async (payload: SubmitFeedbackPayload) => {
  const response = await fetch(`${API_URL}/submit-feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to submit feedback");
  }

  return response.json();
};
