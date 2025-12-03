import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem("access_token_installation");
  const expiration = localStorage.getItem("expiration_installation");

  const isTokenValid = token && expiration && new Date(expiration) > new Date();

  return isTokenValid ? <>{children}</> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
