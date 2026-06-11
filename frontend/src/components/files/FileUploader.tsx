import React, { useState } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { useProject } from "../../hooks/useProject";

interface FileUploaderProps {
  projectId: string;
}

export function FileUploader({ projectId }: FileUploaderProps) {
  const { uploadFile } = useProject();
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value immediately so that selecting the same file again triggers onChange
    e.target.value = "";

    // Reject files above 20MB threshold
    if (file.size > 20 * 1024 * 1024) {
      setError("File size must be under 20MB");
      return;
    }

    setError("");
    uploadFile.mutate(
      { projectId, file },
      {
        onError: (err: any) => {
          setError(err.response?.data?.message || "Upload failed");
        },
      }
    );
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        id={`file-upload-input-${projectId}`}
        onChange={handleFileChange}
        disabled={uploadFile.isPending}
        className="sr-only"
        accept=".pdf,.txt,.md,.csv,.json,.docx,application/pdf,text/plain,text/markdown,text/csv,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
      
      <label
        htmlFor={`file-upload-input-${projectId}`}
        className={`flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl p-4 transition-all duration-300 group ${
          uploadFile.isPending
            ? "bg-slate-950/10 cursor-not-allowed opacity-60"
            : "hover:border-indigo-500/50 bg-slate-950/30 hover:bg-slate-950/50 cursor-pointer"
        }`}
      >
        {uploadFile.isPending ? (
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mb-2" />
        ) : (
          <Upload className="h-6 w-6 text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors duration-200" />
        )}
        <span className="text-xs text-slate-400 group-hover:text-slate-200 text-center font-medium transition-colors duration-200">
          {uploadFile.isPending ? "Uploading file..." : "Upload Document"}
        </span>
        <span className="text-[10px] text-slate-650 mt-1 text-center">
          PDF, TXT, MD, CSV, JSON, DOCX up to 20MB
        </span>
      </label>

      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
