import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner, InlineError } from "@/components/layout";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error-handler";
import { getRedirectPath } from "@/lib/navigation";
import { PieChart } from "lucide-react";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirect:
        typeof search.redirect === "string" ? search.redirect : undefined,
    };
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const {
    login,
    isAuthenticated,
    isLoading,
    error: authError,
    clearError,
  } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirectPath = getRedirectPath(search.redirect);
      navigate({ to: redirectPath as any });
    }
  }, [isAuthenticated, isLoading, navigate, search.redirect]);

  // Clear errors when component mounts
  useEffect(() => {
    setError("");
    clearError();
  }, [clearError]);

  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    setError("");
    clearError();

    try {
      const data = await apiClient.login(email, password);

      // Use AuthProvider's login method
      login(data.token, data.user);

      // Redirect to intended destination or dashboard
      const redirectPath = getRedirectPath(search.redirect);
      navigate({ to: redirectPath as any });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    const redirectParam = search.redirect
      ? { redirect: search.redirect }
      : undefined;
    navigate({
      to: "/register",
      search: redirectParam,
    });
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto mb-4">
            <PieChart className="h-6 w-6" />
          </div>
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground mt-4">
            Loading Duitmu...
          </p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  const displayError = error || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto mb-4">
            <PieChart className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Duite.</h1>
          <p className="text-muted-foreground">uangmu terbang kemanakah ~</p>
        </div>

        {displayError && (
          <InlineError
            description={displayError}
            onDismiss={() => {
              setError("");
              clearError();
            }}
          />
        )}

        <LoginForm
          onSubmit={handleLogin}
          onSwitchToRegister={handleSwitchToRegister}
          isLoading={loginLoading}
          error={displayError || undefined}
        />
      </div>
    </div>
  );
}
