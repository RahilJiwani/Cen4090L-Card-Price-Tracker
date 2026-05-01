import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../Hooks/useAuth.js";
import AuthLoading from "../Pages/AuthLoading.jsx";

export function ProtectedRoute({ children }) {
    const { authChecked, isLoggedIn, user, refreshAuth } = useAuth();

    useEffect(() => { refreshAuth(); }, []);

    if (!authChecked) {
        return <AuthLoading />;
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (!user?.is_verified) {
        return <Navigate to="/signup-verification" replace />;
    }

    return children;
}

export function PublicOnlyRoute({ children }) {
    const { authChecked, isLoggedIn } = useAuth();

    if (!authChecked) {
        return <AuthLoading />;
    }

    if (isLoggedIn) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export function UnverifiedOnlyRoute({ children }) {
    const { authChecked, isLoggedIn, user, refreshAuth } = useAuth();

    useEffect(() => { refreshAuth(); }, []);

    if (!authChecked) {
        return <AuthLoading />;
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (user?.is_verified) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
