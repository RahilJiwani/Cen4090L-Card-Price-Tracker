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
            return "Please enter a valid email address (example: name@example.com).";

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
            setError(err.message || "Signup failed.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/*color bar */}
                <div style={styles.manaBar} />

                <h1 style={styles.title}>MTG Price Tracker</h1>
                <p style={styles.subtitle}>
                    Create an account to track cards and get notified when prices drop.
                </p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>Username</label>
                    <input
                        style={styles.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Planeswalker"
                    />

                    <label style={styles.label}>Email</label>
                    <input
                        style={styles.input}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mage@ravnica.com"
                    />

                    <label style={styles.label}>Password</label>
                    <input
                        style={styles.input}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                    />

                    <label style={styles.label}>Confirm Password</label>
                    <input
                        style={styles.input}
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-enter password"
                    />

                    <button
                        style={styles.button}
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

//Styling
const styles = {

    page: {
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #2c2c2c, #0f0f0f)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, serif",
    },

    card: {
        width: "420px",
        padding: "30px",
        borderRadius: "14px",
        background: "#1b1b1b",
        boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
        border: "1px solid #444",
    },

    manaBar: {
        height: "6px",
        borderRadius: "6px",
        marginBottom: "20px",
        background:
            "linear-gradient(90deg,#f8f6d8,#4c78d0,#1d7a3a,#8b2c2c,#222,#d7a73f)",
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
        marginTop: "10px",
        fontSize: "13px",
        color: "#bbb",
    },

    input: {
        marginTop: "6px",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #444",
        background: "#111",
        color: "#eee",
    },

    button: {
        marginTop: "18px",
        padding: "12px",
        borderRadius: "10px",
        border: "none",
        fontWeight: "bold",
        background: "#d7a73f",
        color: "#111",
        cursor: "pointer",
    },

    error: {
        background: "#4a1f1f",
        border: "1px solid #a33",
        padding: "10px",
        borderRadius: "8px",
        marginBottom: "12px",
        color: "#ffbaba",
    },

    footer: {
        marginTop: "18px",
        textAlign: "center",
        color: "#aaa",
    },

    link: {
        color: "#d7a73f",
        textDecoration: "none",
        fontWeight: "bold",
    },
};