import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user } = useAuth();

    if (!user) {
        // Not logged in, redirect to login
        return <Navigate to="/login" replace />;
    }

    // Logged in, render the children components
    return children;
};

export default ProtectedRoute;
