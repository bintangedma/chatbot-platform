import { Link } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";
import { Bot } from "lucide-react";

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
            <Bot className="h-6 w-6" />
          </div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sign in to manage your AI chatbots
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
export default LoginPage;
