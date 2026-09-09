import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If the user's role is restricted on this specific page (e.g. non-admin trying to access /admin)
        // redirect them to the common dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}