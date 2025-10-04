"use client"

import { useState, forwardRef, useImperativeHandle, useRef } from "react"
import { Pencil, RefreshCw, Check, X, Square } from "lucide-react"
import Message from "./Message"
import Composer from "./Composer"
import { cls, timeAgo } from "./utils"

function ThinkingMessage({ onPause }:any) {
  return (
    <Message role="assistant">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
        </div>
        <span className="text-sm text-muted-foreground">AI is thinking...</span>
        <button
          onClick={onPause}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <Square className="h-3 w-3" /> Stop
        </button>
      </div>
    </Message>
  )
}

const ChatPane = forwardRef(function ChatPane(
  { conversation, user, onSend, onEditMessage, onResendMessage, isThinking, onPauseThinking }:any,
  ref:any,
) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const composerRef = useRef<any>(null)

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent:any) => {
        composerRef.current?.insertTemplate(templateContent)
      },
    }),
    [],
  )

  if (!conversation) return null

  const tags = ["Certified", "Personalized", "Experienced", "Helpful", user?.exam_type].filter(Boolean)
  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const count = messages.length || conversation.messageCount || 0

  function startEdit(m:any) {
    setEditingId(m.id)
    setDraft(m.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }
  function saveEdit() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    cancelEdit()
  }
  function saveAndResend() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    onResendMessage?.(editingId)
    cancelEdit()
  }

  return (
    <div className="chat-pane">
      <div className="chat-pane-messages-container">
        <div className="chat-pane-header">
          <span className="chat-pane-title">{conversation.title}</span>
        </div>
        <div className="chat-pane-meta">
          Updated {timeAgo(conversation.updatedAt)} · {count} messages
        </div>

        <div className="chat-pane-tags">
          {tags.map((t) => (
            <span
              key={t}
              className="chat-pane-tag"
            >
              {t}
            </span>
          ))}
        </div>

        {messages.length === 0 ? (
          <div className="chat-pane-empty-state">
            No messages yet. Say hello to start.
          </div>
        ) : (
          <>
            {messages.map((m:any) => (
              <div key={m.id} className="space-y-2">
                {editingId === m.id ? (
                  <div className="chat-pane-message-editor">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="chat-pane-message-editor-textarea"
                      rows={3}
                    />
                    <div className="chat-pane-message-editor-actions">
                      <button
                        onClick={saveEdit}
                        className="chat-pane-message-editor-button primary"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={saveAndResend}
                        className="chat-pane-message-editor-button secondary"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="chat-pane-message-editor-button tertiary"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <Message
                    role={m.role}
                    user={user}
                    images={m.images}
                    audioUrl={m.audioUrl}
                    audioDuration={m.audioDuration}
                    isStreaming={m.isStreaming}
                    isError={m.isError}
                  >
                    {m.content && <div className="whitespace-pre-wrap">{m.content}</div>}
                    {m.role === "user" && (
                      <div className="mt-1 flex gap-2 text-[11px] text-muted-foreground">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => startEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={() => onResendMessage?.(m.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Resend
                        </button>
                      </div>
                    )}
                  </Message>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <Composer
        ref={composerRef}
        onSend={async (messageData:any) => {
          if (typeof messageData === "string") {
            if (!messageData.trim()) return
            setBusy(true)
            await onSend?.(messageData)
            setBusy(false)
          } else {
            if (!messageData.text?.trim() && !messageData.images?.length && !messageData.audioUrl) return
            setBusy(true)
            await onSend?.(messageData)
            setBusy(false)
          }
        }}
        busy={busy}
        onStop={onPauseThinking}
      />
    </div>
  )
})

export default ChatPane
