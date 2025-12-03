import React from "react";
import { Navigate } from "react-router-dom";

const withAuth = (WrappedComponent: React.ComponentType<any>) => {
  return (props: any) => {
    const authToken = localStorage.getItem("access_token_installation");

    if (!authToken) {
      return <Navigate to="/" replace />;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
