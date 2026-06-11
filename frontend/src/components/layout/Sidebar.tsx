import { Link, useLocation } from "react-router-dom";
import { useUIStore } from "../../store/uiStore";
import { useProject } from "../../hooks/useProject";
import { LayoutDashboard, Plus, Bot, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

export function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setActiveModal = useUIStore((state) => state.setActiveModal);
  const location = useLocation();
  const { useProjectsQuery } = useProject();
  const { data: projects } = useProjectsQuery();

  const handleLinkClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      useUIStore.getState().setSidebarOpen(false);
    }
  };

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col pt-16 bg-slate-900 border-r border-slate-800/60 transition-all duration-300 ease-in-out overflow-hidden",
        sidebarOpen ? "w-64" : "w-0 lg:w-[60px]"
      )}
    >
      {/* Inner content wrapper — always 64 wide, clips when sidebar collapses */}
      <div className="flex flex-col flex-1 w-64 min-w-[64px] overflow-hidden">

        {/* Top nav section */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-thin mt-2">

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleLinkClick}
                title={!sidebarOpen ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600/90 to-indigo-700/70 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap transition-all duration-200",
                    sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                  )}
                >
                  {item.name}
                </span>
                {isActive && sidebarOpen && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60 shrink-0" />
                )}
              </Link>
            );
          })}

          {/* Projects Section */}
          <div className="pt-3 mt-2">
            {/* Section label */}
            <div
              className={cn(
                "flex items-center justify-between px-3 mb-1.5 transition-all duration-200",
                sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Projects
              </span>
              <button
                onClick={() => setActiveModal("create-project")}
                className="flex items-center justify-center h-5 w-5 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-150"
                title="New project"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Collapsed: show only icons for each project */}
            {!sidebarOpen && (
              <button
                onClick={() => setActiveModal("create-project")}
                className="flex items-center justify-center w-full py-2.5 text-slate-500 hover:text-indigo-400 transition-colors duration-150"
                title="New project"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}

            <div className="space-y-0.5">
              {projects &&
                projects.map((project) => {
                  const projectPath = `/projects/${project.id}`;
                  const isActive = location.pathname === projectPath;
                  return (
                    <Link
                      key={project.id}
                      to={projectPath}
                      onClick={handleLinkClick}
                      title={!sidebarOpen ? project.name : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group",
                        isActive
                          ? "bg-slate-800/80 text-indigo-300 ring-1 ring-inset ring-indigo-500/20"
                          : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                      )}
                    >
                      {/* Active indicator dot */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
                      )}
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300"
                        )}
                      >
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <span
                        className={cn(
                          "truncate transition-all duration-200",
                          sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                        )}
                      >
                        {project.name}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}
export default Sidebar;
