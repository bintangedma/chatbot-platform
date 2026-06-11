import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { useAuth } from "../../hooks/useAuth";
import { Menu, LogOut, Bot, ChevronDown, Zap } from "lucide-react";
import { Button } from "../ui/button";

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800/60 bg-slate-950/80 px-4 backdrop-blur-xl">
      {/* Left: hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all duration-150 hover:bg-slate-800 hover:text-white"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Bot className="h-4 w-4 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-950">
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold tracking-tight text-white">Chatlytix</span>
          </div>
        </div>
      </div>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-2">
        {user && (
          <div className="hidden sm:flex items-center gap-2.5 rounded-xl px-3 py-1.5 cursor-default">
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-2 ring-inset ring-indigo-500/30 text-xs font-bold text-indigo-300 uppercase select-none">
              {user.name?.charAt(0) ?? "U"}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">{user.name}</span>
              <span className="text-[10px] text-slate-500 max-w-[120px] truncate">{user.email}</span>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout.mutate()}
          className="flex items-center gap-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-9 px-3"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs font-medium">Logout</span>
        </Button>
      </div>
    </header>
  );
}
export default Navbar;
