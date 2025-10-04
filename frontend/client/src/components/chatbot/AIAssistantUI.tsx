"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Calendar, LayoutGrid, MoreHorizontal } from "lucide-react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatPane from "./ChatPane"
import GhostIconButton from "./GhostIconButton"
import ThemeToggle from "./ThemeToggle"
import { INITIAL_TEMPLATES, INITIAL_FOLDERS } from "./mockData"
import { sendChatMessage } from "../../lib/chatbot-api-client"
import { useAuth } from "@/contexts/auth-context"

export default function AIAssistantUI() {
  const { user } = useAuth()
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("theme")
    if (saved) return saved
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      return "dark"
    return "light"
  })

  useEffect(() => {
    try {
      if (theme === "dark") document.documentElement.classList.add("dark")
      else document.documentElement.classList.remove("dark")
      document.documentElement.setAttribute("data-theme", theme)
      document.documentElement.style.colorScheme = theme
      localStorage.setItem("theme", theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    try {
      const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
      if (!media) return
      const listener = (e:any) => {
        const saved = localStorage.getItem("theme")
        if (!saved) setTheme(e.matches ? "dark" : "light")
      }
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    } catch {}
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebar-collapsed")
      return raw ? JSON.parse(raw) : { pinned: true, recent: false, folders: true, templates: true }
    } catch {
      return { pinned: true, recent: false, folders: true, templates: true }
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
    } catch {}
  }, [collapsed])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed-state")
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
    } catch {}
  }, [sidebarCollapsed])

  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [folders, setFolders] = useState(INITIAL_FOLDERS)

  const [query, setQuery] = useState("")
  const searchRef = useRef(null)

  const [isThinking, setIsThinking] = useState(false)
  const [thinkingConvId, setThinkingConvId] = useState(null)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    const onKey = (e:any) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        createNewChat()
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault()
          searchRef.current?.focus()
        }
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen, conversations])

  useEffect(() => {
    if (conversations.length === 0) {
      createNewChat()
    }
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
  }, [conversations, query])

  const pinned = filtered.filter((c) => c.pinned).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

  const folderCounts = React.useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.name, 0]))
    for (const c of conversations) if (map[c.folder] != null) map[c.folder] += 1
    return map
  }, [conversations, folders])

  function togglePin(id:any) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }

  function createNewChat() {
    const id = Math.random().toString(36).slice(2)
    const item = {
      id,
      title: "New Chat",
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      preview: "Say hello to start...",
      pinned: false,
      folder: "Work Projects",
      messages: [], // Ensure messages array is empty for new chats
    }
    setConversations((prev) => [item, ...prev])
    setSelectedId(id)
    setSidebarOpen(false)
  }

  function createFolder() {
    const name = prompt("Folder name")
    if (!name) return
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) return alert("Folder already exists.")
    setFolders((prev) => [...prev, { id: Math.random().toString(36).slice(2), name }])
  }

  function sendMessage(convId:any, messageData:any) {
    let content = ""
    let images:any = []
    let audioUrl = null
    let audioDuration = null

    if (typeof messageData === "string") {
      // Legacy text-only format
      content = messageData
      if (!content.trim()) return
    } else {
      // Rich content format
      content = messageData.text || ""
      images = messageData.images || []
      audioUrl = messageData.audioUrl || null
      audioDuration = messageData.audioDuration || null

      // At least one type of content must be present
      if (!content.trim() && images.length === 0 && !audioUrl) return
    }

    const now = new Date().toISOString()
    const userMsg = {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content,
      images,
      audioUrl,
      audioDuration,
      createdAt: now,
    }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = [...(c.messages || []), userMsg]

        let preview = ""
        if (content) {
          preview = content.slice(0, 80)
        } else if (images.length > 0) {
          preview = `📷 ${images.length} image${images.length > 1 ? "s" : ""}`
        } else if (audioUrl) {
          preview = "🎤 Voice message"
        }

        return {
          ...c,
          messages: msgs,
          updatedAt: now,
          messageCount: msgs.length,
          preview,
        }
      }),
    )

    const assistantMsgId = Math.random().toString(36).slice(2)
    const assistantMsg = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      isStreaming: true,
    }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        return {
          ...c,
          messages: [...(c.messages || []), assistantMsg],
        }
      }),
    )

    setIsThinking(true)
    setThinkingConvId(convId)

    abortControllerRef.current = new AbortController()

    const conv = conversations.find((c) => c.id === convId)
    const history = (conv?.messages || []).filter((m) => !m.isStreaming)

    sendChatMessage({
      conversationId: convId,
      content,
      images,
      audioUrl,
      audioDuration,
      history,
      onChunk: (chunk:any) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            return {
              ...c,
              messages: c.messages.map((m) => (m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m)),
            }
          }),
        )
      },
      signal: abortControllerRef.current.signal,
    })
      .then((fullResponse) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            const msgs = c.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, content: fullResponse, isStreaming: false } : m,
            )
            return {
              ...c,
              messages: msgs,
              updatedAt: new Date().toISOString(),
              messageCount: msgs.length,
              preview: fullResponse.slice(0, 80),
            }
          }),
        )
      })
      .catch((error) => {
        console.error("[v0] Error sending message:", error)
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: `Error: ${error.message}`,
                      isStreaming: false,
                      isError: true,
                    }
                  : m,
              ),
            }
          }),
        )
      })
      .finally(() => {
        setIsThinking(false)
        setThinkingConvId(null)
        abortControllerRef.current = null
      })
  }

  function editMessage(convId:any, messageId:any, newContent:any) {
    const now = new Date().toISOString()
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        )
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        }
      }),
    )
  }

  function resendMessage(convId:any, messageId:any) {
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg) return
    sendMessage(convId, msg.content)
  }

  function stopStreaming() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsThinking(false)
    setThinkingConvId(null)
  }

  function pauseThinking() {
    stopStreaming()
  }

  function handleUseTemplate(template:any) {
    if (composerRef.current) {
      composerRef.current.insertTemplate(template.content)
    }
  }

  const composerRef = useRef(null)

  const selected = conversations.find((c) => c.id === selectedId) || null

  return (
    <div className="chatbot-container">
      <div className="chatbot-mobile-header">
        <div className="chatbot-mobile-header-title">
          <span className="inline-flex h-4 w-4 items-center justify-center">✱</span> AI Assistant
        </div>
        <div className="chatbot-mobile-header-actions">
          <GhostIconButton label="Schedule">
            <Calendar className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="Apps">
            <LayoutGrid className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>

      <div className="chatbot-main-content">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
          setTheme={setTheme}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          folders={folders}
          folderCounts={folderCounts}
          selectedId={selectedId}
          onSelect={(id:any) => setSelectedId(id)}
          togglePin={togglePin}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createFolder={createFolder}
          createNewChat={createNewChat}
          templates={templates}
          setTemplates={setTemplates}
          onUseTemplate={handleUseTemplate}
        />

        <main className="chatbot-main-area">
          <Header createNewChat={createNewChat} sidebarCollapsed={sidebarCollapsed} setSidebarOpen={setSidebarOpen} />
          <ChatPane
            ref={composerRef}
            conversation={selected}
            user={user}
            onSend={(content:any) => selected && sendMessage(selected.id, content)}
            onEditMessage={(messageId:any, newContent:any) => selected && editMessage(selected.id, messageId, newContent)}
            onResendMessage={(messageId:any) => selected && resendMessage(selected.id, messageId)}
            isThinking={isThinking && thinkingConvId === selected?.id}
            onPauseThinking={pauseThinking}
          />
        </main>
      </div>
    </div>
  )
}
