import { Link } from "react-router-dom";
import { Bot, Home } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md text-center space-y-6 relative z-10">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5 mb-2">
            <Bot className="h-8 w-8" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold text-white">404</h1>
          <h2 className="text-xl font-semibold text-slate-200">Page Not Found</h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/dashboard">
            <Button className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
export default NotFoundPage;
