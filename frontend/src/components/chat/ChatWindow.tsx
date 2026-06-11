import { useRef, useEffect } from "react";
import { Message } from "../../types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatWindowProps {
  messages: Message[];
  isStreaming?: boolean;
}

export function ChatWindow({ messages, isStreaming }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-slate-950/20 scrollbar-thin">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="text-slate-650 text-sm">
            No messages yet. Send a prompt to start the conversation!
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isStreaming && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
export default ChatWindow;
