import { ProjectFile } from "../../types";
import { useProject } from "../../hooks/useProject";
import { FileText, Trash2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface FileListProps {
  projectId: string;
  files: ProjectFile[];
}

export function FileList({ projectId, files }: FileListProps) {
  const { deleteFile } = useProject();

  const handleDelete = (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteFile.mutate({ projectId, fileId });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
      {files.length === 0 ? (
        <p className="text-xs text-slate-650 text-center py-4">No documents uploaded.</p>
      ) : (
        files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/20 p-2.5 hover:border-slate-700/50 hover:bg-slate-950/40 transition-all duration-200"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-200 font-medium truncate" title={file.filename}>
                  {file.filename}
                </p>
                <p className="text-[10px] text-slate-500">{formatSize(file.file_size)}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(file.id)}
              disabled={deleteFile.isPending}
              className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full shrink-0"
            >
              {deleteFile.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
export default FileList;
