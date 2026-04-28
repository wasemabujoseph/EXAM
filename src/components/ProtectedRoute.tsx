import React from 'react';
import { Navigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { vault } = useVault();

  if (!vault) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
