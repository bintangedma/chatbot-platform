import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { User as UserIcon, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!name) {
      tempErrors.name = "Name is required";
    } else if (name.length < 2) {
      tempErrors.name = "Name must be at least 2 characters";
    }
    
    if (!email) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Invalid email address";
    }
    
    if (!password) {
      tempErrors.password = "Password is required";
    } else if (password.length < 8) {
      tempErrors.password = "Password must be at least 8 characters";
    } else if (!/\d/.test(password)) {
      tempErrors.password = "Password must contain at least one number";
    }
    
    if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    register.mutate(
      { name, email, password },
      {
        onSuccess: () => {
          navigate("/dashboard");
        },
        onError: (err: any) => {
          const errMsg = err.response?.data?.message || "Email already registered or registration failed.";
          setErrors({ general: errMsg });
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Name</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <UserIcon className="h-5 w-5" />
          </div>
          <Input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Email Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Mail className="h-5 w-5" />
          </div>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Lock className="h-5 w-5" />
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Confirm Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Lock className="h-5 w-5" />
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={register.isPending}>
        {register.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
}
export default RegisterForm;
