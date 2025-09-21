const API_URL = `/api/auth`;

export const login = async (email: any, password: any) => {
  const response = await fetch(`/api/auth/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
};

export const signup = async (name: any, email: any, password: any, exam_type: any) => {
  const response = await fetch(`${API_URL}/signup/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password, exam_type }),
  });

  if (!response.ok) {
    throw new Error("Signup failed");
  }

  return response.json();
};

export const googleLogin = async (accessToken: string) => {
  const response = await fetch(`/api/auth/google/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!response.ok) {
    throw new Error("Google login failed");
  }

  return response.json();
};

export const getUser = async (token: any) => {
  const response = await fetch(`/api/auth/user/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
};
