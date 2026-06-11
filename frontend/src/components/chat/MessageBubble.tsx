import ReactMarkdown from "react-markdown";
import { Message } from "../../types";
import { cn } from "../../utils/cn";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  
  return (
    <div className={cn("flex w-full gap-3 py-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-slate-800 text-indigo-400 border border-slate-700">
          <Bot className="h-4 w-4" />
        </div>
      )}
      
      <div
        className={cn(
          "relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all duration-300",
          isUser
            ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none"
            : "bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/50"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert max-w-none text-slate-200 prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-sm">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
export default MessageBubble;
