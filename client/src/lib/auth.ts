const API_URL = `http://${window.location.hostname}:8000/api/auth`;

export const login = async (email: any, password: any) => {
  const response = await fetch(`${API_URL}/login/`, {
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

export const getUser = async (token: any) => {
  const response = await fetch(`${API_URL}/user/`, {
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return response.json();
};
