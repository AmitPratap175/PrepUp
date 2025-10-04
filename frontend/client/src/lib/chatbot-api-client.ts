import { API_CONFIG, getApiUrl, handleApiError } from "./chatbot-api-config"

/**
 * Send a chat message to the backend with streaming support
 * @param {Object} params - Message parameters
 * @param {string} params.conversationId - ID of the conversation
 * @param {string} params.content - Text content of the message
 * @param {Array} params.images - Array of image objects with {url, name}
 * @param {string} params.audioUrl - URL of audio file
 * @param {number} params.audioDuration - Duration of audio in seconds
 * @param {Array} params.history - Previous messages for context
 * @param {Function} params.onChunk - Callback for streaming chunks
 * @param {AbortSignal} params.signal - AbortController signal for cancellation
 * @returns {Promise<string>} - Complete response text
 */
export async function sendChatMessage({
  conversationId,
  content,
  images = [],
  audioUrl = null,
  audioDuration = null,
  history = [],
  onChunk = null,
  signal = null,
}:any) {
  const endpoint =
    API_CONFIG.STREAMING_ENABLED && onChunk ? API_CONFIG.ENDPOINTS.CHAT_STREAM : API_CONFIG.ENDPOINTS.CHAT

  const url = getApiUrl(endpoint)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Token ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: content,
        // message: {
        //   content,
        //   images,
        //   audio_url: audioUrl,
        //   audio_duration: audioDuration,
        // },
        // history: history.map((msg:any) => ({
        //   role: msg.role,
        //   content: msg.content,
        //   images: msg.images,
        //   audio_url: msg.audioUrl,
        //   audio_duration: msg.audioDuration,
        // })),
      }),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    // Handle non-streaming response
    const data = await response.json()
    return data.reply || data.message || ""
  } catch (error:any) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Upload an image to the backend
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} - {url, name}
 */
export async function uploadImage(file:any) {
  const formData = new FormData()
  formData.append("file", file)

  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.UPLOAD_IMAGE), {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      url: data.url || data.file_url,
      name: file.name,
    }
  } catch (error:any) {
    throw new Error(handleApiError(error))
  }
}

/**
 * Upload an audio file to the backend
 * @param {Blob} audioBlob - Audio blob to upload
 * @param {number} duration - Duration in seconds
 * @returns {Promise<Object>} - {url, duration}
 */
export async function uploadAudio(audioBlob:any, duration:any) {
  const formData = new FormData()
  formData.append("file", audioBlob, "voice-note.webm")
  formData.append("duration", duration.toString())

  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.UPLOAD_AUDIO), {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      url: data.url || data.file_url,
      duration: data.duration || duration,
    }
  } catch (error:any) {
    throw new Error(handleApiError(error))
  }
}
