import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function LoginPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const LOGIN_ENDPOINT = "/api/auth/login";

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        if (!username || !password) {
            setError("Both username and password are required.");
            return;
        }

        try {
            setSubmitting(true);

            const res = await fetch(LOGIN_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                }),
            });

            if (!res.ok) {
                let message = `Login failed (${res.status})`;
                try {
                    const data = await res.json();
                    message = data.error || data.message || message;
                } catch {
                    const text = await res.text().catch(() => "");
                    if (text) message = text;
                }
                throw new Error(message);
            }

            // Route to dashboard on successful login
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Login failed.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.manaBar} />

                <h1 style={styles.title}>MTG Price Tracker</h1>
                <p style={styles.subtitle}>Welcome back, Planeswalker.</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>Username</label>
                    <input
                        style={styles.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Planeswalker"
                    />

                    <label style={styles.label}>Password</label>
                    <input
                        style={styles.input}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                    />

                    <button style={styles.button} type="submit" disabled={submitting}>
                        {submitting ? "Authenticating..." : "Login"}
                    </button>
                </form>

                <div style={styles.footer}>
                    Don't have an account?{" "}
                    <Link to="/signup" style={styles.link}>
                        Create one
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;

const styles = {
    page: {
        padding: "20px",
        fontFamily: "sans-serif",
    },
    card: {
        maxWidth: "300px",
        margin: "0 auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "4px",
    },
    title: {
        fontSize: "1.5rem",
        marginBottom: "1rem",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    label: {
        fontWeight: "bold",
    },
    input: {
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
    },
    button: {
        padding: "10px",
        marginTop: "10px",
        cursor: "pointer",
    },
    error: {
        color: "red",
        marginBottom: "10px",
    },
    footer: {
        marginTop: "20px",
        fontSize: "0.9rem",
    },
    separator: {
        display: "none",
    },
    subtitle: {
        display: "none",
    },
    manaBar: {
        display: "none",
    }
};