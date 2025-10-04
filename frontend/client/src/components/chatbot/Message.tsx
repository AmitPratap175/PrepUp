import { cls } from "./utils"
import VoiceNotePlayer from "./VoiceNotePlayer"

export default function Message({ role, user, children, images, audioUrl, audioDuration, isStreaming, isError }:any) {
  const isUser = role === "user"

  const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    } else {
      return names[0].substring(0, 2).toUpperCase();
    }
  }

  return (
    <div className={cls("message", isUser ? "user" : "assistant")}>
      {!isUser && (
        <div className="message-avatar">
          AI
        </div>
      )}
      <div
        className={cls(
          "message-content",
          isUser ? "user" : "assistant",
          isError && "error",
        )}
      >
        {images && images.length > 0 && (
          <div
            className={cls(
              "message-images",
              children ? "with-content" : "",
              isUser ? "user" : "assistant",
            )}
          >
            {images.map((img:any, idx:any) => (
              <img
                key={idx}
                src={img.url || "/placeholder.svg"}
                alt={img.name || `Image ${idx + 1}`}
                className="message-image"
              />
            ))}
          </div>
        )}

        {audioUrl && <VoiceNotePlayer audioUrl={audioUrl} duration={audioDuration} />}

        {children && (
          <div>
            {children}
            {isStreaming && <span className="message-streaming-indicator" />}
          </div>
        )}
      </div>
      {isUser && user && (
        <div className="message-avatar">
          {getInitials(user.name)}
        </div>
      )}
    </div>
  )
}
