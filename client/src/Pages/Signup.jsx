import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../Hooks/useAuth.js";

function SignupPage() {
    const navigate = useNavigate();
    const { signup } = useAuth();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false); // New state for toggling password visibility

    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    function validate() {
        const u = username.trim();
        const e = email.trim().toLowerCase();

        if (!u) return "Username is required.";
        if (u.length < 3) return "Username must be at least 3 characters.";

        if (!e) return "Email is required.";

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(e))
            return "Please enter a valid email address (example: jace@ravnica.com).";

        if (!password) return "Password is required.";
        if (password.length < 8) return "Password must be at least 8 characters.";

        if (confirm !== password) return "Passwords do not match.";

        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        const msg = validate();
        if (msg) {
            setError(msg);
            return;
        }

        try {
            setSubmitting(true);

            await signup({
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password,
            });

            navigate("/SignupVerification");
        } catch (err) {
            setError(err.message || "Summoning failed. The spell fizzled.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="accent-bar" />

                <h1 className="auth-title">MTG Price Tracker</h1>
                <p className="auth-subtitle">
                    Create an account to track cards and get notified when prices drop.
                </p>

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
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="field-label">Email</label>
                        <input
                            id="email"
                            className="text-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mage@ravnica.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="field-label">Password</label>
                        <input
                            id="password"
                            className="text-input"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="field-label">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            className="text-input"
                            type={showPassword ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Re-enter password"
                            required
                        />
                    </div>

                    <div className="checkbox-row">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                onChange={() => setShowPassword(!showPassword)}
                            />
                            Show Passwords
                        </label>
                    </div>

                    <button className="primary-button" type="submit" disabled={submitting}>
                        {submitting ? "Summoning Account..." : "Create Account"}
                    </button>
                </form>

                <div className="footer-note">
                    Already have an account?{" "}
                    <Link to="/login" className="text-link">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SignupPage;
