"use client"
import { motion, AnimatePresence } from "framer-motion"
import {
  PanelLeftClose,
  PanelLeftOpen,
  SearchIcon,
  Plus,
  Star,
  Clock,
  FolderIcon,
  FileText,
  Settings,
  Asterisk,
} from "lucide-react"
import SidebarSection from "./SidebarSection"
import ConversationRow from "./ConversationRow"
import FolderRow from "./FolderRow"
import TemplateRow from "./TemplateRow"
import ThemeToggle from "./ThemeToggle"
import CreateFolderModal from "./CreateFolderModal"
import CreateTemplateModal from "./CreateTemplateModal"
import SearchModal from "./SearchModal"
import SettingsPopover from "./SettingsPopover"
import { cls } from "./utils"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"

export default function Sidebar({
  open,
  onClose,
  theme,
  setTheme,
  collapsed,
  setCollapsed,
  conversations,
  pinned,
  recent,
  folders,
  folderCounts,
  selectedId,
  onSelect,
  togglePin,
  query,
  setQuery,
  searchRef,
  createFolder,
  createNewChat,
  templates = [],
  setTemplates = () => {},
  onUseTemplate = () => {},
  sidebarCollapsed = false,
  setSidebarCollapsed = () => {},
}:any) {
  const { user } = useAuth();
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showSearchModal, setShowSearchModal] = useState(false)

  const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    } else {
      return names[0].substring(0, 2).toUpperCase();
    }
  }

  const getConversationsByFolder = (folderName:any) => {
    return conversations.filter((conv:any) => conv.folder === folderName)
  }

  const handleCreateFolder = (folderName:any) => {
    createFolder(folderName)
  }

  const handleDeleteFolder = (folderName:any) => {
    const updatedConversations = conversations.map((conv:any) =>
      conv.folder === folderName ? { ...conv, folder: null } : conv,
    )
    console.log("Delete folder:", folderName, "Updated conversations:", updatedConversations)
  }

  const handleRenameFolder = (oldName:any, newName:any) => {
    const updatedConversations = conversations.map((conv:any) =>
      conv.folder === oldName ? { ...conv, folder: newName } : conv,
    )
    console.log("Rename folder:", oldName, "to", newName, "Updated conversations:", updatedConversations)
  }

  const handleCreateTemplate = (templateData:any) => {
    if (editingTemplate) {
      const updatedTemplates = templates.map((t:any) =>
        t.id === editingTemplate.id ? { ...templateData, id: editingTemplate.id } : t,
      )
      setTemplates(updatedTemplates)
      setEditingTemplate(null)
    } else {
      const newTemplate = {
        ...templateData,
        id: Date.now().toString(),
      }
      setTemplates([...templates, newTemplate])
    }
    setShowCreateTemplateModal(false)
  }

  const handleEditTemplate = (template:any) => {
    setEditingTemplate(template)
    setShowCreateTemplateModal(true)
  }

  const handleRenameTemplate = (templateId:any, newName:any) => {
    const updatedTemplates = templates.map((t:any) =>
      t.id === templateId ? { ...t, name: newName, updatedAt: new Date().toISOString() } : t,
    )
    setTemplates(updatedTemplates)
  }

  const handleDeleteTemplate = (templateId:any) => {
    const updatedTemplates = templates.filter((t:any) => t.id !== templateId)
    setTemplates(updatedTemplates)
  }

  const handleUseTemplate = (template:any) => {
    onUseTemplate(template)
  }

  if (sidebarCollapsed) {
    return (
      <motion.aside
        initial={{ width: 320 }}
        animate={{ width: 64 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="sidebar collapsed"
      >
        <div className="sidebar-header">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={createNewChat}
            className="rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="New Chat"
          >
            <Plus className="h-5 w-5" />
          </button>

          <button
            onClick={() => setShowSearchModal(true)}
            className="rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          <button
            className="rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Folders"
          >
            <FolderIcon className="h-5 w-5" />
          </button>

          <div className="mt-auto mb-4">
            <SettingsPopover>
              <button
                className="rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </SettingsPopover>
          </div>
        </div>
      </motion.aside>
    )
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(open || typeof window !== "undefined") && (
          <motion.aside
            key="sidebar"
            initial={{ x: -340 }}
            animate={{ x: open ? 0 : 0 }}
            exit={{ x: -340 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="sidebar"
          >
            <div className="sidebar-header">
              <div className="sidebar-header-logo">
                <div className="sidebar-header-logo-icon">
                  <Asterisk className="h-4 w-4" />
                </div>
                <div className="sidebar-header-title">AI Assistant</div>
              </div>
              <div className="sidebar-header-actions">
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:block rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close sidebar"
                  title="Close sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>

                <button
                  onClick={onClose}
                  className="md:hidden rounded-xl p-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="sidebar-search-container">
              <label htmlFor="search" className="sr-only">
                Search conversations
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="search"
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  onClick={() => setShowSearchModal(true)}
                  onFocus={() => setShowSearchModal(true)}
                  className="sidebar-search-input"
                />
              </div>
            </div>

            <div className="sidebar-new-chat-container">
              <button
                onClick={createNewChat}
                className="sidebar-new-chat-button"
                title="New Chat (⌘N)"
              >
                <Plus className="h-4 w-4" /> Start New Chat
              </button>
            </div>

            <nav className="sidebar-nav">
              <SidebarSection
                icon={<Star className="h-4 w-4" />}
                title="PINNED CHATS"
                collapsed={collapsed.pinned}
                onToggle={() => setCollapsed((s:any) => ({ ...s, pinned: !s.pinned }))}
              >
                {pinned.length === 0 ? (
                  <div className="select-none rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    Pin important threads for quick access.
                  </div>
                ) : (
                  pinned.map((c:any) => (
                    <ConversationRow
                      key={c.id}
                      data={c}
                      active={c.id === selectedId}
                      onSelect={() => onSelect(c.id)}
                      onTogglePin={() => togglePin(c.id)}
                    />
                  ))
                )}
              </SidebarSection>

              <SidebarSection
                icon={<Clock className="h-4 w-4" />}
                title="RECENT"
                collapsed={collapsed.recent}
                onToggle={() => setCollapsed((s:any) => ({ ...s, recent: !s.recent }))}
              >
                {recent.length === 0 ? (
                  <div className="select-none rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    No conversations yet. Start a new one!
                  </div>
                ) : (
                  recent.map((c:any) => (
                    <ConversationRow
                      key={c.id}
                      data={c}
                      active={c.id === selectedId}
                      onSelect={() => onSelect(c.id)}
                      onTogglePin={() => togglePin(c.id)}
                      showMeta
                    />
                  ))
                )}
              </SidebarSection>

              <SidebarSection
                icon={<FolderIcon className="h-4 w-4" />}
                title="FOLDERS"
                collapsed={collapsed.folders}
                onToggle={() => setCollapsed((s:any) => ({ ...s, folders: !s.folders }))}
              >
                <div className="-mx-1">
                  <button
                    onClick={() => setShowCreateFolderModal(true)}
                    className="mb-2 inline-flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Plus className="h-4 w-4" /> Create folder
                  </button>

                  {folders.map((f:any) => (
                    <FolderRow
                      key={f.id}
                      name={f.name}
                      count={folderCounts[f.name] || 0}
                      conversations={getConversationsByFolder(f.name)}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      togglePin={togglePin}
                      onDeleteFolder={handleDeleteFolder}
                      onRenameFolder={handleRenameFolder}
                    />
                  ))}
                </div>
              </SidebarSection>

              <SidebarSection
                icon={<FileText className="h-4 w-4" />}
                title="TEMPLATES"
                collapsed={collapsed.templates}
                onToggle={() => setCollapsed((s:any) => ({ ...s, templates: !s.templates }))}
              >
                <div className="-mx-1">
                  <button
                    onClick={() => setShowCreateTemplateModal(true)}
                    className="mb-2 inline-flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Plus className="h-4 w-4" /> Create template
                  </button>

                  {(Array.isArray(templates) ? templates : []).map((template:any) => (
                    <TemplateRow
                      key={template.id}
                      template={template}
                      onUseTemplate={handleUseTemplate}
                      onEditTemplate={handleEditTemplate}
                      onRenameTemplate={handleRenameTemplate}
                      onDeleteTemplate={handleDeleteTemplate}
                    />
                  ))}

                  {(!templates || templates.length === 0) && (
                    <div className="select-none rounded-lg border border-dashed border-zinc-200 px-3 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      No templates yet. Create your first prompt template.
                    </div>
                  )}
                </div>
              </SidebarSection>
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-footer-content">
                <SettingsPopover>
                  <button className="sidebar-footer-settings-button">
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                </SettingsPopover>
                <div className="sidebar-footer-theme-toggle">
                  <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>
              </div>
              {user && (
                <div className="sidebar-footer-user-profile">
                  <div className="sidebar-footer-user-avatar">
                    {getInitials(user.name)}
                  </div>
                  <div className="sidebar-footer-user-info">
                    <div className="sidebar-footer-user-name">{user.name}</div>
                    <div className="sidebar-footer-user-workspace">Pro workspace</div>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreateFolder={handleCreateFolder}
      />

      <CreateTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => {
          setShowCreateTemplateModal(false)
          setEditingTemplate(null)
        }}
        onCreateTemplate={handleCreateTemplate}
        editingTemplate={editingTemplate}
      />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        conversations={conversations}
        selectedId={selectedId}
        onSelect={onSelect}
        togglePin={togglePin}
        createNewChat={createNewChat}
      />
    </>
  )
}
