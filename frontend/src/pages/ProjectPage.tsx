import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject } from "../hooks/useProject";
import { useUIStore } from "../store/uiStore";
import { useAuthStore } from "../store/authStore";
import { Navbar } from "../components/layout/Navbar";
import { Sidebar } from "../components/layout/Sidebar";
import { ChatWindow } from "../components/chat/ChatWindow";
import { ChatInput } from "../components/chat/ChatInput";
import { FileUploader } from "../components/files/FileUploader";
import { FileList } from "../components/files/FileList";
import { EditProjectModal } from "../components/projects/EditProjectModal";
import { Message } from "../types";
import { ArrowLeft, Settings, AlertCircle, Sparkles, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../utils/cn";


export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((state) => state.accessToken);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  const { useProjectDetailQuery } = useProject();
  const { data: project, isLoading, isError, refetch } = useProjectDetailQuery(id || "");

  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");


  // Sync historical messages from api
  useEffect(() => {
    if (project?.messages) {
      setLocalMessages(project.messages);
    }
  }, [project]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !id || isStreaming) return;
    const messageContent = inputText.trim();
    setInputText("");

    // Append user query message locally
    const userMsgId = "user-" + Date.now();
    const userMsg: Message = {
      id: userMsgId,
      project_id: id,
      role: "user",
      content: messageContent,
      created_at: new Date().toISOString(),
    };
    
    // Append assistant placeholder message locally
    const assistantMsgId = "assistant-" + Date.now();
    const assistantMsg: Message = {
      id: assistantMsgId,
      project_id: id,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

    try {
      const response = await fetch(`${API_URL}/projects/${id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageContent }),
      });

      if (!response.ok) {
        throw new Error("Chat completions failed");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        
        // Store unfinished chunk tail segment in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          
          if (cleanLine.startsWith("data: ")) {
            const dataStr = cleanLine.substring(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                setLocalMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: m.content + parsed.token } : m
                  )
                );
              } else if (parsed.error) {
                setLocalMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: m.content + `\n\n[Error: ${parsed.error}]` } : m
                  )
                );
              }
            } catch (err) {
              console.error("SSE line parse failed", cleanLine, err);
            }
          }
        }
      }
      
      // Invalidate queries to refresh list counts
      refetch();
    } catch (err) {
      console.error("Streaming error:", err);
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: m.content + "\n\n[Communication error. Streaming response failed.]" }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4 bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center max-w-md">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <h3 className="text-lg font-semibold text-slate-200">Unable to load project</h3>
            <p className="text-sm text-slate-400">
              The project may have been deleted, or you might not have permission to view it.
            </p>
            <Link to="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />

        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => useUIStore.getState().setSidebarOpen(false)}
          />
        )}

        <main
          className={`flex-1 flex flex-col transition-all duration-300 overflow-hidden ${
            sidebarOpen ? "lg:pl-64" : "pl-0 lg:pl-16"
          }`}
        >
          {/* Mobile Tab Switcher */}
          <div className="flex border-b border-slate-800/80 lg:hidden shrink-0 bg-slate-900/20">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-xs font-semibold text-center uppercase tracking-wider transition-colors ${
                activeTab === "chat" ? "text-indigo-400 border-b-2 border-indigo-500 font-bold" : "text-slate-400"
              }`}
            >
              Chat Playpen
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-3 text-xs font-semibold text-center uppercase tracking-wider transition-colors ${
                activeTab === "settings" ? "text-indigo-400 border-b-2 border-indigo-500 font-bold" : "text-slate-400"
              }`}
            >
              Instructions & Docs
            </button>
          </div>

          <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
            {/* Left Panel: Settings & Files */}
            <section
              className={cn(
                "w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/20 p-6 flex-col gap-6 overflow-y-auto overscroll-y-contain shrink-0 scrollbar-thin",
                activeTab === "settings" ? "flex flex-1" : "hidden lg:flex"
              )}
            >
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h2 className="text-lg font-bold text-white truncate">{project.name}</h2>
              </div>

              {/* Prompt Config panel */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-550 uppercase tracking-wider">System Instructions</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    className="h-7 px-2.5 text-xs text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Edit Prompt
                  </Button>
                </div>
                <div className="rounded-lg bg-slate-950/40 border border-slate-800/80 p-3 text-xs text-slate-400 leading-relaxed max-h-36 overflow-y-auto scrollbar-thin">
                  {project.system_prompt}
                </div>
              </div>

              {/* Documents panel */}
              <div className="flex-grow flex flex-col gap-3 overflow-hidden">
                <span className="text-xs font-semibold text-slate-555 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  Knowledge Base Documents
                </span>
                
                <FileUploader projectId={project.id} />
                
                <div className="flex-1 mt-2 overflow-y-auto">
                  <FileList projectId={project.id} files={project.files || []} />
                </div>
              </div>
            </section>

            {/* Right Panel: Chat Stream Area */}
            <section
              className={cn(
                "flex-grow flex flex-col overflow-hidden bg-slate-950/10",
                activeTab === "chat" ? "flex flex-grow" : "hidden lg:flex"
              )}
            >
              {/* Header bar */}
              <div className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 bg-slate-900/10">
                <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  Live Agent Playpen
                </span>
              </div>

              {/* Chat scroll pane */}
              <ChatWindow messages={localMessages} isStreaming={isStreaming} />

              {/* Input prompt section */}
              <div className="p-4 border-t border-slate-800/80 bg-slate-900/10">
                <ChatInput
                  value={inputText}
                  onChange={setInputText}
                  onSend={handleSendMessage}
                  disabled={isStreaming}
                  isStreaming={isStreaming}
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      <EditProjectModal
        project={project}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
    </div>
  );
}
export default ProjectPage;
