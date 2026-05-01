import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../Hooks/useAuth.js";


function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        if (!username || !password) {
            setError("Both username and password are required.");
            return;
        }

        try {
            setSubmitting(true);

            await login({
                username: username.trim(),
                password,
            });

            // Route to dashboard on successful login
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="accent-bar" />

                <h1 className="auth-title">MTG Price Tracker</h1>
                <p className="auth-subtitle">Welcome back, Planeswalker.</p>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username" className="field-label">Username</label>
                        <input
                            id="username"
                            className="text-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Planeswalker"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="field-label">Password</label>
                        <input
                            id="password"
                            className="text-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                        />
                    </div>

                    <button className="primary-button" type="submit" disabled={submitting}>
                        {submitting ? "Authenticating..." : "Login"}
                    </button>
                </form>

                <div className="footer-note">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-link">
                        Create one
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
