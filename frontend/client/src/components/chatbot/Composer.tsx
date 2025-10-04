"use client"

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Send, Loader2, Plus, Mic, Square, Paperclip, X } from "lucide-react"
import ComposerActionsPopover from "./ComposerActionsPopover"
import { cls } from "./utils"

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}


const Composer = forwardRef(function Composer({ onSend, onStop, busy }:any, ref:any) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [lineCount, setLineCount] = useState(1)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<any>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const [voiceError, setVoiceError] = useState(null)
  const inputRef = useRef<any>(null)
  const fileInputRef = useRef<any>(null)
  const mediaRecorderRef = useRef<any>(null)
  const audioChunksRef = useRef<any>([])
  const recordingIntervalRef = useRef<any>(null)
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        // Existing speech recognition setup code
      } else {
        setSpeechSupported(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    }
  }, [])

  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current
      const lineHeight = 20
      const minHeight = 40

      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const calculatedLines = Math.max(1, Math.floor((scrollHeight - 16) / lineHeight))

      setLineCount(calculatedLines)

      if (calculatedLines <= 12) {
        textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`
        textarea.style.overflowY = "hidden"
      } else {
        textarea.style.height = `${minHeight + 11 * lineHeight}px`
        textarea.style.overflowY = "auto"
      }
    }
  }, [value])

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent:any) => {
        setValue((prev) => {
          const newValue = prev ? `${prev}\n\n${templateContent}` : templateContent
          setTimeout(() => {
            inputRef.current?.focus()
            const length = newValue.length
            inputRef.current?.setSelectionRange(length, length)
          }, 0)
          return newValue
        })
      },
      focus: () => {
        inputRef.current?.focus()
      },
    }),
    [],
  )

  async function toggleAudioRecording() {
    if (isRecordingAudio) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      setIsRecordingAudio(false)
      setRecordingTime(0)
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          const audioUrl = URL.createObjectURL(audioBlob)

          // Send voice note immediately
          handleSendVoiceNote(audioUrl, recordingTime)

          // Stop all tracks
          stream.getTracks().forEach((track) => track.stop())
          audioChunksRef.current = []
        }

        mediaRecorder.start()
        setIsRecordingAudio(true)
        setRecordingTime(0)
        setVoiceError(null)

        // Start timer
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1)
        }, 1000)
      } catch (error) {
        console.error("[v0] Error accessing microphone:", error)
        setVoiceError("Microphone access denied. Please allow microphone permissions." as any)
        setTimeout(() => setVoiceError(null), 5000)
      }
    }
  }

  async function handleSendVoiceNote(audioUrl:any, duration:any) {
    setSending(true)
    try {
      await onSend?.({
        text: "",
        audioUrl,
        audioDuration: duration,
      })
    } finally {
      setSending(false)
    }
  }

  function handleImageUpload(e:any) {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((file:any) => file.type.startsWith("image/"))

    imageFiles.forEach((file:any) => {
      const reader = new FileReader()
      reader.onload = (event:any) => {
        setUploadedImages((prev:any) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            url: event.target.result,
            name: file.name,
          },
        ])
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function removeImage(id:any) {
    setUploadedImages((prev:any) => prev.filter((img:any) => img.id !== id))
  }

  async function handleSend() {
    if ((!value.trim() && uploadedImages.length === 0) || sending) return
    setSending(true)
    try {
      const messageData = {
        text: value,
        images: uploadedImages,
      }
      await onSend?.(messageData)
      setValue("")
      setUploadedImages([])
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  function handleStop() {
    onStop?.()
  }

  const hasContent = value.length > 0 || uploadedImages.length > 0
  const formatRecordingTime = (seconds:any) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="border-t border-zinc-200/60 p-4 dark:border-zinc-800">
      <div
        className={cls(
          "mx-auto flex flex-col rounded-2xl border bg-white shadow-sm dark:bg-zinc-950 transition-all duration-200",
          "max-w-3xl border-zinc-300 dark:border-zinc-700 p-3",
        )}
      >
        {voiceError && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {voiceError}
          </div>
        )}

        {isRecordingAudio && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 flex items-center gap-2 dark:bg-red-900/20 dark:border-red-800">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-700 dark:text-red-400 font-medium">
              Recording... {formatRecordingTime(recordingTime)}
            </span>
          </div>
        )}

        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            {uploadedImages.map((img:any) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.url || "/placeholder.svg"}
                  alt={img.name}
                  className="h-20 w-20 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="How can I help you today?"
            rows={1}
            className={cls(
              "w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400 transition-all duration-200",
              "px-0 py-2 min-h-[40px] text-left",
            )}
            style={{
              height: "auto",
              overflowY: lineCount > 12 ? "auto" : "hidden",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <ComposerActionsPopover>
              <button
                className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="Add attachment"
              >
                <Plus className="h-4 w-4" />
              </button>
            </ComposerActionsPopover>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
              title="Upload image"
            >
              <Paperclip className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleAudioRecording}
              className={cls(
                "inline-flex items-center justify-center rounded-full p-2 transition-colors",
                isRecordingAudio
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
              )}
              title={isRecordingAudio ? "Stop recording" : "Record voice note"}
            >
              <Mic className={cls("h-4 w-4", isRecordingAudio && "animate-pulse")} />
            </button>
            {busy ? (
              <button
                onClick={handleStop}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={sending || !hasContent}
                className={cls(
                  "inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-white dark:text-zinc-900",
                  (sending || !hasContent) && "opacity-50 cursor-not-allowed",
                )}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-2 max-w-3xl px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>
          Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line.
        </span>
      </div>
    </div>
  )
})

export default Composer