import React, { useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled, isStreaming }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Resize height to match text rows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="relative flex items-end gap-2 border border-slate-800 bg-slate-900/60 rounded-xl px-3 py-2.5 backdrop-blur-sm focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all duration-200">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder={isStreaming ? "Streaming response..." : "Type a message... (Enter to send, Shift+Enter for newline)"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-1 max-h-40 min-h-[24px] resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-650 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 py-1"
      />
      <Button
        variant="default"
        size="icon"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="h-8 w-8 rounded-lg shrink-0"
      >
        {isStreaming ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <Send className="h-4 w-4 text-white" />
        )}
      </Button>
    </div>
  );
}
export default ChatInput;
