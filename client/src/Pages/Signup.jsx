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

            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Summoning failed. The spell fizzled.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* WUBRG Color Bar */}
                <div style={styles.manaBar} />

                <h1 style={styles.title}>MTG Price Tracker</h1>
                <p style={styles.subtitle}>
                    Create an account to track cards and get notified when prices drop.
                </p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <label htmlFor="username" style={styles.label}>Username</label>
                    <input
                        id="username"
                        style={styles.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Planeswalker"
                        required
                    />

                    <label htmlFor="email" style={styles.label}>Email</label>
                    <input
                        id="email"
                        style={styles.input}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mage@ravnica.com"
                        required
                    />

                    <label htmlFor="password" style={styles.label}>Password</label>
                    <div style={styles.passwordContainer}>
                        <input
                            id="password"
                            style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            required
                        />
                    </div>

                    <label htmlFor="confirmPassword" style={styles.label}>Confirm Password</label>
                    <div style={styles.passwordContainer}>
                        <input
                            id="confirmPassword"
                            style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                            type={showPassword ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Re-enter password"
                            required
                        />
                    </div>

                    {/* Tiny toggle for password visibility */}
                    <div style={styles.toggleContainer}>
                        <label style={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                onChange={() => setShowPassword(!showPassword)}
                                style={{ marginRight: '5px' }}
                            />
                            Show Passwords
                        </label>
                    </div>

                    <button
                        style={{
                            ...styles.button,
                            ...(submitting ? styles.buttonDisabled : {})
                        }}
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting ? "Summoning Account..." : "Create Account"}
                    </button>
                </form>

                <div style={styles.footer}>
                    Already have an account?{" "}
                    <Link to="/login" style={styles.link}>
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SignupPage;

// Styling
const styles = {
    page: {
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #2c2c2c, #0f0f0f)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, serif", // Classic MTG feel
    },
    card: {
        width: "420px",
        padding: "30px",
        borderRadius: "14px",
        background: "#1b1b1b",
        boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
        border: "1px solid #444",
        boxSizing: "border-box",
    },
    manaBar: {
        height: "6px",
        borderRadius: "6px",
        marginBottom: "20px",
        background:
            "linear-gradient(90deg, #f8f6d8, #4c78d0, #1d7a3a, #8b2c2c, #222, #d7a73f)",
    },
    title: {
        fontSize: "26px",
        textAlign: "center",
        marginBottom: "6px",
        color: "#f5f5f5",
        letterSpacing: "1px",
    },
    subtitle: {
        textAlign: "center",
        fontSize: "14px",
        color: "#aaa",
        marginBottom: "20px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
    },
    label: {
        marginTop: "12px",
        fontSize: "13px",
        color: "#bbb",
    },
    passwordContainer: {
        display: "flex",
        alignItems: "center",
        width: "100%",
    },
    input: {
        marginTop: "6px",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #444",
        background: "#111",
        color: "#eee",
        fontFamily: "inherit",
    },
    toggleContainer: {
        marginTop: "8px",
        display: "flex",
        justifyContent: "flex-end",
    },
    toggleLabel: {
        fontSize: "12px",
        color: "#aaa",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
    },
    button: {
        marginTop: "20px",
        padding: "12px",
        borderRadius: "10px",
        border: "none",
        fontWeight: "bold",
        fontSize: "16px",
        background: "#d7a73f", // Gold/Mythic rare color
        color: "#111",
        cursor: "pointer",
        transition: "background 0.2s",
    },
    buttonDisabled: {
        background: "#7a6229",
        color: "#888",
        cursor: "not-allowed",
    },
    error: {
        background: "#4a1f1f",
        border: "1px solid #a33",
        padding: "10px",
        borderRadius: "8px",
        marginBottom: "12px",
        color: "#ffbaba",
        fontSize: "14px",
    },
    footer: {
        marginTop: "20px",
        textAlign: "center",
        color: "#aaa",
        fontSize: "14px",
    },
    link: {
        color: "#d7a73f",
        textDecoration: "none",
        fontWeight: "bold",
    },
};