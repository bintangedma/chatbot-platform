import { useNavigate } from "react-router-dom";
import { Project } from "../../types";
import { useProject } from "../../hooks/useProject";
import { Bot, MessageSquare, Files, Calendar, Trash2, ArrowUpRight } from "lucide-react";
import { formatDate } from "../../utils/formatDate";

interface ProjectCardProps {
  project: Project;
}

// Deterministic color palette per project (cycles through gradient pairs)
const GRADIENT_PAIRS = [
  { from: "from-indigo-500", to: "to-violet-600", ring: "ring-indigo-500/20", bg: "bg-indigo-500/10" },
  { from: "from-emerald-500", to: "to-teal-600", ring: "ring-emerald-500/20", bg: "bg-emerald-500/10" },
  { from: "from-rose-500", to: "to-pink-600", ring: "ring-rose-500/20", bg: "bg-rose-500/10" },
  { from: "from-amber-500", to: "to-orange-600", ring: "ring-amber-500/20", bg: "bg-amber-500/10" },
  { from: "from-sky-500", to: "to-blue-600", ring: "ring-sky-500/20", bg: "bg-sky-500/10" },
];

function hashProject(id: string): number {
  return id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const { deleteProject } = useProject();
  const palette = GRADIENT_PAIRS[hashProject(project.id) % GRADIENT_PAIRS.length];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
      deleteProject.mutate(project.id);
    }
  };

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="group relative flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700/80 hover:shadow-2xl hover:shadow-slate-950/50 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Subtle top glow accent */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${palette.from} ${palette.to} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${palette.from} ${palette.to} shadow-lg ring-4 ${palette.ring}`}>
            <Bot className="h-5 w-5 text-white" />
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleDelete}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-150"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-100 group-hover:text-white mb-2 line-clamp-1 tracking-tight">
          {project.name}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {project.system_prompt || "No system prompt configured."}
        </p>
      </div>

      {/* Footer divider */}
      <div className="mt-auto px-5 pb-4">
        <div className="flex items-center justify-between pt-3.5 border-t border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{project.message_count ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Files className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{project.file_count ?? 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-slate-600">
            <Calendar className="h-3 w-3" />
            <span className="text-[10px]">{formatDate(project.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProjectCard;
