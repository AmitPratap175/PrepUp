const API_URL = `/api/auth`;

/**
 * Logs a user in by sending their credentials to the API.
 *
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<any>} A promise that resolves with the server's response on successful login.
 * @throws {Error} If the login request fails.
 */
export const login = async (email: string, password: string) => {
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

/**
 * Registers a new user by sending their details to the API.
 *
 * @param {string} name - The user's full name.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's chosen password.
 * @param {string} exam_type - The type of exam the user is preparing for.
 * @returns {Promise<any>} A promise that resolves with the server's response on successful registration.
 * @throws {Error} If the signup request fails.
 */
export const signup = async (name: string, email: string, password: string, exam_type: string) => {
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

/**
 * Fetches the details of the currently authenticated user.
 *
 * @param {string} token - The user's authentication token.
 * @returns {Promise<any>} A promise that resolves with the user's data.
 * @throws {Error} If the request to fetch the user fails.
 */
export const getUser = async (token: string) => {
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
