import React, { useState } from "react";
import { useUIStore } from "../../store/uiStore";
import { useProject } from "../../hooks/useProject";
import { Modal } from "../ui/modal";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

export function CreateProjectModal() {
  const activeModal = useUIStore((state) => state.activeModal);
  const setActiveModal = useUIStore((state) => state.setActiveModal);
  const { createProject } = useProject();

  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [error, setError] = useState("");

  const isOpen = activeModal === "create-project";

  const handleClose = () => {
    setName("");
    setSystemPrompt("You are a helpful assistant.");
    setError("");
    setActiveModal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    createProject.mutate(
      { name, system_prompt: systemPrompt },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: any) => {
          setError(err.response?.data?.message || "Failed to create project");
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs text-red-400">{error}</p>}
        
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Project Name *</label>
          <Input
            type="text"
            placeholder="e.g. Customer Support Bot"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-750 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">System Prompt</label>
          <Textarea
            rows={4}
            placeholder="Describe the instructions for this assistant..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-750 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createProject.isPending}>
            {createProject.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export default CreateProjectModal;
