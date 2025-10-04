"use client"
import { MoreHorizontal, Menu } from "lucide-react"
import GhostIconButton from "./GhostIconButton"

export default function Header({ createNewChat, sidebarCollapsed, setSidebarOpen }:any) {
  return (
    <div className="chatbot-header">
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="chatbot-header-menu-button"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="chatbot-header-actions">
        <GhostIconButton label="More">
          <MoreHorizontal className="h-4 w-4" />
        </GhostIconButton>
      </div>
    </div>
  )
}
