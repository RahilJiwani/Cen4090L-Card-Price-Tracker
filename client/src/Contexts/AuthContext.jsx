import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, logoutUser, loginUser, signupUser } from "../API/UserAPI.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    const refreshAuth = useCallback(async () => {
        try {
            const userData = await getCurrentUser();
            if (!userData) {
                setUser(null);
                return;
            }
            setUser(userData);
        } catch {
            setUser(null);
        } finally {
            setAuthChecked(true);
        }
    }, []);

    const logout = useCallback(async () => {
        await logoutUser();
        await refreshAuth();
    }, []);

    const login = useCallback(async (credentials) => {
        await loginUser(credentials);
        await refreshAuth();
    }, [refreshAuth]);

    const signup = useCallback(async (accountData) => {
        await signupUser(accountData);
        await refreshAuth();
    }, [refreshAuth]);

    useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);

    const value = useMemo(() => ({
        user,
        isLoggedIn: Boolean(user),
        authChecked,
        login,
        signup,
        logout,
    }), [user, authChecked, refreshAuth, login, signup, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };