export function TypingIndicator() {
  return (
    <div className="flex w-full gap-3 py-3 justify-start items-center">
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-slate-800 text-indigo-400 border border-slate-700">
        <span className="animate-pulse">...</span>
      </div>
      <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm">
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
        <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500" />
      </div>
    </div>
  );
}
export default TypingIndicator;
