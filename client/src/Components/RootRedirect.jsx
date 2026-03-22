import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../Hooks/useAuth.js';
import AuthLoading from '../Pages/AuthLoading.jsx';

function RootRedirect() {
    const { authChecked, isLoggedIn } = useAuth();

    //if checking the user's auth status, return loading screen
    if (!authChecked) {
        return <AuthLoading />;
    }

    // if they are logged in, send them to the dashboard
    if (isLoggedIn) {
        return <Navigate to="/dashboard" replace />;
    }

    // if they are not logged in, send them to the signup page
    return <Navigate to="/signup" replace />;
}

export default RootRedirect;