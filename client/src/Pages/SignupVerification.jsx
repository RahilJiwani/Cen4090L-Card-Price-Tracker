import { useState, useEffect } from "react";

export default function SignupVerification() {
    const [startTime, setStartTime] = useState(5);
    const [time, setTime] = useState(startTime);

    useEffect(() => {
    const intervalId = setInterval(() => {
        setTime((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="auth-shell">
            <div className="verification-card">
                <div className="accent-bar" />
                <h1 className="auth-title">Signup Verification</h1>
                <p className="verification-copy">Please check your email for a verification link.</p>
                {time <= 0 ? (
                    <p className="verification-copy">Your verification email has expired.</p>
                ) : (
                    <p className="verification-copy">Your verification email will expire in {time} seconds.</p>
                )}
                <div className="verification-actions">
                    <button className="primary-button" onClick={() => time <= 0 && setTime(startTime)}>
                        Resend Verification Email
                    </button>
                </div>
            </div>
        </div>
    )
}