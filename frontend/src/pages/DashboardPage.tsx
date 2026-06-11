import { useProject } from "../hooks/useProject";
import { useUIStore } from "../store/uiStore";
import { ProjectList } from "../components/projects/ProjectList";
import { CreateProjectModal } from "../components/projects/CreateProjectModal";
import { Navbar } from "../components/layout/Navbar";
import { Sidebar } from "../components/layout/Sidebar";
import { Plus, Bot, Sparkles, AlertCircle, MessagesSquare, FileStack, Activity, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";

export function DashboardPage() {
  const { useProjectsQuery } = useProject();
  const { data: projects, isLoading, isError } = useProjectsQuery();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setActiveModal = useUIStore((state) => state.setActiveModal);

  const totalMessages = projects?.reduce((sum, p) => sum + (p.message_count ?? 0), 0) ?? 0;
  const totalFiles = projects?.reduce((sum, p) => sum + (p.file_count ?? 0), 0) ?? 0;

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            onClick={() => useUIStore.getState().setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area — shifts right dynamically */}
        <main
          className={`flex-1 overflow-y-auto overscroll-y-contain transition-all duration-300 ${sidebarOpen ? "lg:pl-64" : "lg:pl-[60px]"
            }`}
        >
          <div className="px-6 py-8 lg:px-10 lg:py-10 max-w-7xl mx-auto">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-6 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Projects
                  </h1>
                </div>
                <p className="text-sm text-slate-500 ml-3">
                  Manage your AI agents, upload knowledge bases, and run chat sessions.
                </p>
              </div>

              <Button
                onClick={() => setActiveModal("create-project")}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border-0 px-4 h-10 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>

            {/* Stats Strip */}
            {!isLoading && !isError && projects && projects.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  {
                    label: "Total Projects",
                    value: projects.length,
                    icon: Bot,
                    color: "text-indigo-400",
                    bg: "bg-indigo-500/10",
                    border: "border-indigo-500/20",
                  },
                  {
                    label: "Messages Sent",
                    value: totalMessages,
                    icon: MessagesSquare,
                    color: "text-violet-400",
                    bg: "bg-violet-500/10",
                    border: "border-violet-500/20",
                  },
                  {
                    label: "Documents",
                    value: totalFiles,
                    icon: FileStack,
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                  },
                  {
                    label: "Active Agents",
                    value: projects.length,
                    icon: Activity,
                    color: "text-amber-400",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`flex items-center gap-4 rounded-2xl border ${stat.border} bg-slate-900/60 p-4 backdrop-blur-sm`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center min-h-[360px] gap-4">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-indigo-500" />
                </div>
                <p className="text-sm text-slate-500">Loading your projects...</p>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-5 rounded-2xl text-red-400 max-w-lg">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Failed to load projects</p>
                  <p className="text-xs text-red-400/70 mt-0.5">Please refresh the page or try again later.</p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && projects && projects.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[420px] text-center">
                {/* Decorative ring glow */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-2xl scale-150" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
                    <Bot className="h-10 w-10 text-slate-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-200 mb-2">No projects yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
                  Create your first AI agent. Configure a system prompt, upload knowledge documents, and test chat completions instantly.
                </p>
                <Button
                  onClick={() => setActiveModal("create-project")}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white h-11 px-6 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Create your first project
                </Button>

                {/* Feature hints */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-xl text-left">
                  {[
                    { icon: Bot, title: "Custom Agents", desc: "Set system-level instructions for each agent's behaviour and tone." },
                    { icon: FileStack, title: "Knowledge Base", desc: "Upload PDFs, DOCX, TXT documents for context-aware RAG responses." },
                    { icon: TrendingUp, title: "Live Streaming", desc: "Real-time token streaming via OpenRouter for fast chat completions." },
                  ].map((f) => (
                    <div key={f.title} className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 mb-3">
                        <f.icon className="h-4 w-4 text-indigo-400" />
                      </div>
                      <p className="text-xs font-semibold text-slate-300 mb-1">{f.title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Grid */}
            {!isLoading && !isError && projects && projects.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    All Agents — {projects.length}
                  </p>
                </div>
                <ProjectList projects={projects} />
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateProjectModal />
    </div>
  );
}
export default DashboardPage;
