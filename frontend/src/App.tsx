import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/authStore";
import { useUIStore } from "./store/uiStore";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectPage } from "./pages/ProjectPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    let wasDesktop = typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
    
    // Set initial state on mount
    useUIStore.getState().setSidebarOpen(wasDesktop);

    const handleResize = () => {
      if (typeof window === "undefined") return;
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop !== wasDesktop) {
        useUIStore.getState().setSidebarOpen(isDesktop);
        wasDesktop = isDesktop;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />

          {/* Protected platform routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
          </Route>

          {/* Fallbacks */}
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
