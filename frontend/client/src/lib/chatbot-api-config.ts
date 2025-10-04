// API Configuration for connecting to Python backend
// Update these values to point to your backend server

export const API_CONFIG = {
  // Base URL of your Python backend
  // For local development: 'http://localhost:8000'
  // For production: 'https://your-backend-domain.com'
  BASE_URL: "",

  // API endpoints
  ENDPOINTS: {
    CHAT: "/api/chatbot/",
    CHAT_STREAM: "/api/chat/stream",
    UPLOAD_IMAGE: "/api/upload/image",
    UPLOAD_AUDIO: "/api/upload/audio",
  },

  // Request timeout in milliseconds
  TIMEOUT: 30000,

  // Enable/disable streaming
  STREAMING_ENABLED: false,
}

// Helper function to build full API URL
export function getApiUrl(endpoint:any) {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// Helper function to handle API errors
export function handleApiError(error:any) {
  console.error("[v0] API Error:", error)

  if (error.name === "AbortError") {
    return "Request was cancelled"
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return "No internet connection. Please check your network."
  }

  if (error.message.includes("Failed to fetch")) {
    return "Unable to connect to server. Please check if the backend is running."
  }

  return error.message || "An unexpected error occurred"
}
