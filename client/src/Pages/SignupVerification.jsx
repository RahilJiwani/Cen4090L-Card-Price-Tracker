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

    return <>
        <h1>Signup Verification</h1>
        <p>Please check your email for a verification link.</p>
        {time <= 0 ? (
            <p>Your verification email has expired.</p>
        ) : (
            <p>Your verification email will expire in {time} seconds.</p>
        )}
        <button onClick={() => time <= 0 && setTime(startTime)}>Resend Verification Email</button>
    </>
}