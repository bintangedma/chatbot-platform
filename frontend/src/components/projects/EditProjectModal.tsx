import React, { useState, useEffect } from "react";
import { useProject } from "../../hooks/useProject";
import { Modal } from "../ui/modal";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface EditProjectModalProps {
  project: { id: string; name: string; system_prompt: string };
  isOpen: boolean;
  onClose: () => void;
}

export function EditProjectModal({ project, isOpen, onClose }: EditProjectModalProps) {
  const { updateProject } = useProject();

  const [name, setName] = useState(project.name);
  const [systemPrompt, setSystemPrompt] = useState(project.system_prompt);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setSystemPrompt(project.system_prompt);
      setError("");
    }
  }, [isOpen, project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    updateProject.mutate(
      {
        projectId: project.id,
        data: { name, system_prompt: systemPrompt },
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          setError(err.response?.data?.message || "Failed to update project");
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project Settings">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs text-red-400">{error}</p>}
        
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Project Name *</label>
          <Input
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">System Prompt</label>
          <Textarea
            rows={4}
            placeholder="Instructions..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateProject.isPending}>
            {updateProject.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default EditProjectModal;
