import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../Hooks/useAuth.js";

export default function SignupVerification() {
    const { resendVerificationEmail } = useAuth();
    const navigate = useNavigate();
    const [startTime, setStartTime] = useState(15);
    const [time, setTime] = useState(startTime);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTime((prev) => Math.max(prev - 1, 0));
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    async function handleResend() {
        if (time > 0 || submitting) {
            return;
        }

        setError(null);
        setSuccessMessage(null);

        try {
            setSubmitting(true);
            await resendVerificationEmail();
            setTime(startTime);
            setSuccessMessage("Verification email resent.");
        } catch (err) {
            if (err.status === 400) {
                navigate("/dashboard", { replace: true });
                return;
            }
            setError(err.message || "Could not resend verification email.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-shell">
            <div className="verification-card">
                <div className="accent-bar" />
                <h1 className="auth-title">Signup Verification</h1>
                <p className="verification-copy">Please check your email for a verification link.</p>
                {time <= 0 ? (
                    <p className="verification-copy">Click to resend the verification email.</p>
                ) : (
                    <p className="verification-copy">You can resend the verification email in {time} seconds.</p>
                )}
                {error && <div className="error-banner">{error}</div>}
                {successMessage && <div className="success-banner">{successMessage}</div>}
                <div className="verification-actions">
                    <button
                        className="primary-button"
                        onClick={handleResend}
                        disabled={time > 0 || submitting}
                    >
                        {submitting ? "Resending..." : "Resend Verification Email"}
                    </button>
                </div>
            </div>
        </div>
    )
}