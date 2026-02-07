import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

// Demo mode disabled for production
const DEMO_MODE = false;

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toastShown = useRef(false);
  
  // Check if demo mode is enabled
  const isDemoAccess = DEMO_MODE && searchParams.get("demo") !== "false";

  // In demo mode, allow access without authentication
  if (isDemoAccess && !isAuthenticated && !isLoading) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (!toastShown.current) {
      toastShown.current = true;
      setTimeout(() => toast.error("Accès réservé. Veuillez vous connecter."), 0);
    }
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === "artisan") {
      return <Navigate to="/artisan/dashboard" replace />;
    } else {
      return <Navigate to="/client/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
